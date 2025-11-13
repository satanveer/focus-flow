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
  private autoSyncInterval: number | null = null;

  // Check if sync is available
  async canSync(): Promise<boolean> {
    try {
      return await googleCalendarService.hasValidTokens();
    } catch (error) {
      console.error('Error checking sync availability:', error);
      return false;
    }
  }

  // Get sync status
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  // Initialize automatic sync for a user
  async initializeAutoSync(userId: string, onSyncComplete?: () => void): Promise<void> {
    this.currentUserId = userId;
    
    const canSync = await this.canSync();
    if (!canSync) {
      console.log('⏭️ Google Calendar not connected, skipping auto-sync initialization');
      return;
    }

    // Perform initial sync to import all Google Calendar events
    try {
      console.log('🔄 Performing initial Google Calendar sync...');
      const result = await this.sync(userId, { direction: 'pull' });
      console.log('✅ Initial sync complete:', result);
      
      // Remove any duplicates that might have been created
      console.log('🧹 Checking for duplicates...');
      const cleanupResult = await this.removeDuplicates(userId);
      if (cleanupResult.removed > 0) {
        console.log(`🗑️ Removed ${cleanupResult.removed} duplicate events`);
      }
      
      // Trigger callback to refresh UI after initial sync and cleanup
      if (onSyncComplete && (result.imported > 0 || result.updated > 0 || cleanupResult.removed > 0)) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('❌ Initial sync failed:', error);
    }

    // Set up auto-sync if enabled
    const settings = this.getSyncSettings();
    if (settings.autoSync) {
      this.startAutoSync(userId, onSyncComplete);
    }
  }

  // Start automatic background sync
  startAutoSync(userId: string, onSyncComplete?: () => void): void {
    // Clear any existing interval
    this.stopAutoSync();

    const settings = this.getSyncSettings();
    const intervalMs = settings.syncInterval * 60 * 1000; // Convert minutes to ms

    console.log(`🔄 Starting auto-sync every ${settings.syncInterval} minutes`);

    this.autoSyncInterval = setInterval(async () => {
      try {
        console.log('🔄 Running scheduled sync...');
        const result = await this.sync(userId, { direction: 'pull' });
        console.log('✅ Scheduled sync complete:', result);
        
        // Trigger callback to refresh UI
        if (onSyncComplete && (result.imported > 0 || result.updated > 0)) {
          onSyncComplete();
        }
      } catch (error) {
        console.error('❌ Scheduled sync failed:', error);
      }
    }, intervalMs);
  }

  // Stop automatic background sync
  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('⏸️ Auto-sync stopped');
    }
  }

  // Remove duplicate events (for cleanup)
  async removeDuplicates(userId: string): Promise<{ removed: number; errors: string[] }> {
    const result = { removed: 0, errors: [] as string[] };
    
    try {
      console.log('🧹 Checking for duplicate events...');
      
      // Get all events
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
      
      const allEvents = await calendarService.getEvents(userId, startDate, endDate);
      
      // Group events by Google Calendar ID and title+startTime
      const eventsByGoogleId = new Map<string, AppwriteCalendarEvent[]>();
      const eventsByKey = new Map<string, AppwriteCalendarEvent[]>();
      
      for (const event of allEvents) {
        // Group by Google Calendar ID
        if (event.googleCalendarId) {
          const existing = eventsByGoogleId.get(event.googleCalendarId) || [];
          existing.push(event);
          eventsByGoogleId.set(event.googleCalendarId, existing);
        }
        
        // Group by title+startTime
        const key = `${event.title}-${new Date(event.startTime).toISOString()}`;
        const existing = eventsByKey.get(key) || [];
        existing.push(event);
        eventsByKey.set(key, existing);
      }
      
      // Find and remove duplicates
      const toDelete = new Set<string>();
      
      // Check Google Calendar ID duplicates
      for (const [googleId, events] of eventsByGoogleId.entries()) {
        if (events.length > 1) {
          console.log(`🔍 Found ${events.length} duplicates for Google Calendar ID: ${googleId}`);
          // Keep the first one, mark others for deletion
          events.slice(1).forEach(event => toDelete.add(event.$id));
        }
      }
      
      // Check title+time duplicates (only if not already marked)
      for (const [key, events] of eventsByKey.entries()) {
        if (events.length > 1) {
          const notMarked = events.filter(e => !toDelete.has(e.$id));
          if (notMarked.length > 1) {
            console.log(`🔍 Found ${notMarked.length} duplicates for: ${key}`);
            // Keep the one with Google Calendar ID, or the first one
            const withGoogleId = notMarked.find(e => e.googleCalendarId);
            const toKeep = withGoogleId || notMarked[0];
            notMarked.filter(e => e.$id !== toKeep.$id).forEach(event => toDelete.add(event.$id));
          }
        }
      }
      
      // Delete duplicates
      for (const eventId of toDelete) {
        try {
          await calendarService.deleteEvent(eventId);
          result.removed++;
          console.log(`🗑️ Removed duplicate event: ${eventId}`);
        } catch (error) {
          const errorMsg = `Failed to delete duplicate event ${eventId}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }
      
      console.log(`✅ Duplicate cleanup complete: ${result.removed} removed`);
    } catch (error) {
      const errorMsg = `Failed to remove duplicates: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }
    
    return result;
  }

  // Main sync function
  async sync(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    const canSync = await this.canSync();
    if (!canSync) {
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
      console.log('📥 Pulling events from Google Calendar...');
      
      const googleResponse = await googleCalendarService.getEvents({
        timeMin: options.timeMin.toISOString(),
        timeMax: options.timeMax.toISOString(),
        maxResults: 500,
      });

      console.log(`📊 Found ${googleResponse.items.length} events in Google Calendar`);

      // Get existing Focus Flow events for the current user
      const localEvents = await calendarService.getEvents(
        this.currentUserId!, 
        options.timeMin.toISOString(),
        options.timeMax.toISOString()
      );

      console.log(`📊 Found ${localEvents.length} events in Appwrite`);

      // Create lookup maps for better matching
      const localEventsByGoogleId = new Map<string, AppwriteCalendarEvent>();
      const localEventsByKey = new Map<string, AppwriteCalendarEvent>();
      
      localEvents.forEach(event => {
        // Map by Google Calendar ID if it exists (primary key)
        if (event.googleCalendarId) {
          localEventsByGoogleId.set(event.googleCalendarId, event);
        }
        
        // Also map by title+startTime as fallback (normalize the date)
        try {
          const eventStartTime = new Date(event.startTime).toISOString();
          const key = `${event.title}-${eventStartTime}`;
          localEventsByKey.set(key, event);
        } catch (error) {
          console.warn('Failed to parse event start time:', event.title, error);
        }
      });

      for (const googleEvent of googleResponse.items) {
        try {
          // Skip Focus Flow created events to avoid duplicates
          if (googleCalendarService.isFocusFlowEvent(googleEvent)) {
            console.log(`⏭️ Skipping Focus Flow event: ${googleEvent.summary}`);
            continue;
          }

          // Check if event already exists in Appwrite by Google Calendar ID (most reliable)
          let existingLocal = googleEvent.id ? localEventsByGoogleId.get(googleEvent.id) : undefined;
          
          // Fallback: check by title and start time (normalize dates for comparison)
          if (!existingLocal) {
            const startTime = googleEvent.start.dateTime || googleEvent.start.date!;
            const normalizedStartTime = new Date(startTime).toISOString();
            const eventKey = `${googleEvent.summary}-${normalizedStartTime}`;
            existingLocal = localEventsByKey.get(eventKey);
            
            if (existingLocal) {
              console.log(`🔍 Found existing event by title+time: ${googleEvent.summary}`);
              
              // Update the existing event to include Google Calendar ID for future syncs
              if (!existingLocal.googleCalendarId && googleEvent.id) {
                console.log(`📝 Adding Google Calendar ID to existing event: ${googleEvent.summary}`);
              }
            }
          }
          
          if (existingLocal) {
            // Check if update is needed
            if (this.needsUpdate(existingLocal, googleEvent)) {
              console.log(`🔄 Updating event: ${googleEvent.summary}`);
              if (!options.dryRun) {
                const updatedEvent = this.convertGoogleToAppwrite(googleEvent, this.currentUserId!);
                await calendarService.updateEvent(existingLocal.$id, updatedEvent);
              }
              result.updated++;
            } else {
              console.log(`✓ Event already up-to-date: ${googleEvent.summary}`);
            }
          } else {
            // Import new event
            console.log(`➕ Importing new event: ${googleEvent.summary}`);
            if (!options.dryRun) {
              const localEvent = this.convertGoogleToAppwrite(googleEvent, this.currentUserId!);
              await calendarService.createEvent(localEvent);
            }
            result.imported++;
          }
        } catch (error) {
          const errorMsg = `Failed to sync Google event ${googleEvent.id}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }
      
      console.log(`✅ Sync complete: ${result.imported} imported, ${result.updated} updated`);
    } catch (error) {
      const errorMsg = `Failed to pull from Google Calendar: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
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

    // Determine event type from Google Calendar metadata or description
    let eventType: 'focus' | 'break' | 'task' | 'meeting' | 'personal' | 'goal' = 'meeting';
    const focusFlowType = googleEvent.extendedProperties?.private?.focusFlowType;
    if (focusFlowType === 'focus' || focusFlowType === 'break' || focusFlowType === 'task') {
      eventType = focusFlowType;
    } else {
      // Infer type from summary/description
      const summary = googleEvent.summary.toLowerCase();
      if (summary.includes('focus') || summary.includes('🎯')) eventType = 'focus';
      else if (summary.includes('break') || summary.includes('☕') || summary.includes('🧘')) eventType = 'break';
      else if (summary.includes('task') || summary.includes('✅')) eventType = 'task';
      else if (summary.includes('personal') || summary.includes('🏠')) eventType = 'personal';
    }

    return {
      title: googleEvent.summary,
      description: googleEvent.description || '',
      type: eventType,
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
      // Google Calendar sync fields
      googleCalendarId: googleEvent.id,
      googleCalendarEtag: googleEvent.id, // Use ID as etag for now
      source: 'google',
      lastSyncedAt: new Date().toISOString(),
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
    const canSync = await this.canSync();
    if (!canSync) {
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
    const canSync = await this.canSync();
    if (!canSync) {
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
    
    // Default settings - auto-sync enabled by default
    return {
      autoSync: true, // Changed to true by default
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