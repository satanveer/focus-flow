// Calendar synchronization service
// Handles two-way sync between Focus Flow internal calendar and Google Calendar

import { calendarService, type AppwriteCalendarEvent } from './appwrite';
import { googleCalendarService, type GoogleCalendarEvent } from './googleCalendar';

export interface SyncOptions {
  timeMin?: Date;
  timeMax?: Date;
  direction?: 'pull' | 'push' | 'both';
  dryRun?: boolean;
}

export interface SyncResult {
  imported: number;
  exported: number;
  updated: number;
  conflicts: number;
  errors: string[];
}

export interface SyncConflict {
  type: 'update' | 'delete' | 'duplicate';
  localEvent?: AppwriteCalendarEvent;
  googleEvent?: GoogleCalendarEvent;
  resolution?: 'keep-local' | 'keep-google' | 'merge' | 'skip';
}

export class CalendarSyncService {
  private syncInProgress = false;
  private currentUserId: string | null = null;

  // Check if sync is available
  canSync(): boolean {
    return googleCalendarService.isAuthenticated();
  }

  // Get sync status
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  // Main sync function
  async sync(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    if (!this.canSync()) {
      throw new Error('Google Calendar not connected');
    }

    if (!userId) {
      throw new Error('User ID is required for sync');
    }

    this.currentUserId = userId;

    this.syncInProgress = true;
    
    try {
      const result: SyncResult = {
        imported: 0,
        exported: 0,
        updated: 0,
        conflicts: 0,
        errors: [],
      };

      const { direction = 'both', timeMin, timeMax } = options;

      // Set default time range if not provided
      const defaultTimeMin = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const defaultTimeMax = timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

      if (direction === 'pull' || direction === 'both') {
        const pullResult = await this.pullFromGoogle({
          timeMin: defaultTimeMin,
          timeMax: defaultTimeMax,
          dryRun: options.dryRun,
        });
        result.imported += pullResult.imported;
        result.updated += pullResult.updated;
        result.conflicts += pullResult.conflicts;
        result.errors.push(...pullResult.errors);
      }

      if (direction === 'push' || direction === 'both') {
        const pushResult = await this.pushToGoogle({
          timeMin: defaultTimeMin,
          timeMax: defaultTimeMax,
          dryRun: options.dryRun,
        });
        result.exported += pushResult.exported;
        result.updated += pushResult.updated;
        result.conflicts += pushResult.conflicts;
        result.errors.push(...pushResult.errors);
      }

      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

    // Pull events from Google Calendar to Focus Flow
  private async pullFromGoogle(options: Required<Pick<SyncOptions, 'timeMin' | 'timeMax'>> & SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      imported: 0,
      exported: 0,
      updated: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      const googleResponse = await googleCalendarService.getEvents({
        timeMin: options.timeMin.toISOString(),
        timeMax: options.timeMax.toISOString(),
        maxResults: 500,
      });

      // Get existing Focus Flow events for the current user
      const localEvents = await calendarService.getEvents(
        this.currentUserId!, // Use the userId passed to sync method
        options.timeMin.toISOString(),
        options.timeMax.toISOString()
      );

      // Create lookup map for local events by title and start time (since we don't have Google ID stored yet)
      const localEventMap = new Map<string, AppwriteCalendarEvent>();
      localEvents.forEach(event => {
        const key = `${event.title}-${event.startTime}`;
        localEventMap.set(key, event);
      });

      for (const googleEvent of googleResponse.items) {
        try {
          // Skip Focus Flow created events to avoid duplicates
          if (googleCalendarService.isFocusFlowEvent(googleEvent)) {
            continue;
          }

          const startTime = googleEvent.start.dateTime || googleEvent.start.date!;
          const eventKey = `${googleEvent.summary}-${startTime}`;
          const existingLocal = localEventMap.get(eventKey);
          
          if (existingLocal) {
            // Check if update is needed
            if (this.needsUpdate(existingLocal, googleEvent)) {
              if (!options.dryRun) {
                const updatedEvent = this.convertGoogleToAppwrite(googleEvent, this.currentUserId!);
                await calendarService.updateEvent(existingLocal.$id, updatedEvent);
              }
              result.updated++;
            }
          } else {
            // Import new event
            if (!options.dryRun) {
              const localEvent = this.convertGoogleToAppwrite(googleEvent, this.currentUserId!);
              await calendarService.createEvent(localEvent);
            }
            result.imported++;
          }
        } catch (error) {
          result.errors.push(`Failed to sync Google event ${googleEvent.id}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to pull from Google Calendar: ${error}`);
    }

    return result;
  }

    // Push events from Focus Flow to Google Calendar
  private async pushToGoogle(options: Required<Pick<SyncOptions, 'timeMin' | 'timeMax'>> & SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      imported: 0,
      exported: 0,
      updated: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Get Focus Flow events for export
      const localEvents = await calendarService.getEvents(
        this.currentUserId!,
        options.timeMin.toISOString(),
        options.timeMax.toISOString()
      );

      // For now, export all events that aren't breaks or system events
      const eventsToExport = localEvents.filter(event => 
        event.type !== 'break' && 
        !event.description?.includes('🚀 Synced from Focus Flow')
      );

      for (const localEvent of eventsToExport) {
        try {
          if (!options.dryRun) {
            const googleEvent = this.convertAppwriteToGoogle(localEvent);
            await googleCalendarService.createEvent(googleEvent);
          }
          result.exported++;
        } catch (error) {
          result.errors.push(`Failed to export event ${localEvent.$id}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to push to Google Calendar: ${error}`);
    }

    return result;
  }

  // Convert Google Calendar event to Appwrite format
  private convertGoogleToAppwrite(googleEvent: GoogleCalendarEvent, userId: string): Omit<AppwriteCalendarEvent, '$id' | '$createdAt' | '$updatedAt'> {
    const startDate = new Date(googleEvent.start.dateTime || googleEvent.start.date!);
    const endDate = new Date(googleEvent.end.dateTime || googleEvent.end.date!);

    return {
      title: googleEvent.summary,
      description: googleEvent.description || '',
      type: 'meeting', // Default type for Google Calendar events
      status: 'scheduled',
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      allDay: !googleEvent.start.dateTime, // All-day events don't have dateTime
      recurrence: 'none',
      recurrenceInterval: 1,
      location: googleEvent.location || '',
      color: this.mapGoogleColorToLocal(googleEvent.colorId),
      attendees: JSON.stringify(googleEvent.attendees?.map(a => a.email) || []),
      reminders: JSON.stringify([15]), // Default 15 min reminder
      tags: JSON.stringify(['google-calendar']),
      userId,
    };
  }

  // Convert Appwrite event to Google Calendar format
  private convertAppwriteToGoogle(localEvent: AppwriteCalendarEvent): GoogleCalendarEvent {
    const event: GoogleCalendarEvent = {
      summary: localEvent.title,
      description: localEvent.description,
      location: localEvent.location,
      start: localEvent.allDay 
        ? { date: localEvent.startTime.split('T')[0] }
        : { 
            dateTime: localEvent.startTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
      end: localEvent.allDay
        ? { date: new Date(new Date(localEvent.endTime).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
        : { 
            dateTime: localEvent.endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
      colorId: this.mapLocalColorToGoogle(localEvent.color),
    };

    // Add Focus Flow metadata
    const tags = localEvent.tags ? JSON.parse(localEvent.tags) : [];
    if (tags.length > 0) {
      event.description += `\n\nTags: ${tags.join(', ')}`;
    }
    event.description += '\n\n🚀 Synced from Focus Flow';

    return event;
  }

  // Check if a local event needs to be updated based on Google event
  private needsUpdate(localEvent: AppwriteCalendarEvent, googleEvent: GoogleCalendarEvent): boolean {
    const googleStart = new Date(googleEvent.start.dateTime || googleEvent.start.date!);
    const googleEnd = new Date(googleEvent.end.dateTime || googleEvent.end.date!);
    const localStart = new Date(localEvent.startTime);
    const localEnd = new Date(localEvent.endTime);

    return (
      localEvent.title !== googleEvent.summary ||
      localEvent.description !== (googleEvent.description || '') ||
      localEvent.location !== (googleEvent.location || '') ||
      localStart.getTime() !== googleStart.getTime() ||
      localEnd.getTime() !== googleEnd.getTime()
    );
  }

  // Map Google Calendar color IDs to Focus Flow colors
  private mapGoogleColorToLocal(colorId?: string): string {
    const colorMap: Record<string, string> = {
      '1': '#a4bdfc', // Lavender
      '2': '#7ae7bf', // Sage
      '3': '#dbadff', // Grape
      '4': '#ff887c', // Flamingo
      '5': '#fbd75b', // Banana
      '6': '#ffb878', // Tangerine
      '7': '#46d6db', // Peacock
      '8': '#e1e1e1', // Graphite
      '9': '#5484ed', // Blueberry
      '10': '#51b749', // Basil
      '11': '#dc2127', // Tomato
    };
    return colorMap[colorId || '9'] || '#5484ed';
  }

  // Map Focus Flow colors to Google Calendar color IDs
  private mapLocalColorToGoogle(color?: string): string {
    // Reverse mapping - find closest Google color
    const colorMap: Record<string, string> = {
      '#5484ed': '9', // Blue
      '#51b749': '10', // Green
      '#dc2127': '11', // Red
      '#fbd75b': '5', // Yellow
      '#ff887c': '4', // Orange/Red
      '#7ae7bf': '2', // Green
      '#dbadff': '3', // Purple
    };
    
    // Find closest color or default to blue
    for (const [localColor, googleId] of Object.entries(colorMap)) {
      if (color === localColor) {
        return googleId;
      }
    }
    return '9'; // Default to blue
  }

  // Auto-log a focus session to Google Calendar
  async logFocusSession(sessionData: {
    title?: string;
    startTime: Date;
    endTime: Date;
    taskTitle?: string;
    productivity?: 'great' | 'some-distractions' | 'unfocused';
    duration: number;
  }): Promise<GoogleCalendarEvent | null> {
    if (!this.canSync()) {
      return null;
    }

    try {
      const event = googleCalendarService.createFocusSessionEvent(sessionData);
      return await googleCalendarService.createEvent(event);
    } catch (error) {
      console.error('Failed to log focus session to Google Calendar:', error);
      return null;
    }
  }

  // Auto-log a break session to Google Calendar
  async logBreakSession(sessionData: {
    startTime: Date;
    endTime: Date;
    type: 'short' | 'long';
    duration: number;
  }): Promise<GoogleCalendarEvent | null> {
    if (!this.canSync()) {
      return null;
    }

    try {
      const event = googleCalendarService.createBreakSessionEvent(sessionData);
      return await googleCalendarService.createEvent(event);
    } catch (error) {
      console.error('Failed to log break session to Google Calendar:', error);
      return null;
    }
  }

  // Get sync settings from local storage
  getSyncSettings(): {
    autoSync: boolean;
    autoLogSessions: boolean;
    syncInterval: number; // minutes
    lastSyncTime?: Date;
  } {
    const settings = localStorage.getItem('calendar_sync_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return {
        ...parsed,
        lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : undefined,
      };
    }
    
    return {
      autoSync: false,
      autoLogSessions: true,
      syncInterval: 15, // 15 minutes default
    };
  }

  // Update sync settings
  updateSyncSettings(settings: Partial<{
    autoSync: boolean;
    autoLogSessions: boolean;
    syncInterval: number;
  }>): void {
    const currentSettings = this.getSyncSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem('calendar_sync_settings', JSON.stringify(newSettings));
  }

  // Update last sync time
  updateLastSyncTime(): void {
    const settings = this.getSyncSettings();
    settings.lastSyncTime = new Date();
    localStorage.setItem('calendar_sync_settings', JSON.stringify(settings));
  }
}

// Export singleton instance
export const calendarSyncService = new CalendarSyncService();