# Google Calendar Auto-Sync Implementation

## 📋 Overview

I've implemented an automatic Google Calendar sync system that:

1. **Automatically imports** all Google Calendar events to Appwrite when you first connect
2. **Stores events locally** in your Appwrite database for persistent offline access
3. **Syncs periodically** in the background to keep events up-to-date
4. **Reduces API calls** by using Appwrite as the primary data source
5. **Tracks sync status** to know which events came from Google vs. created locally

## 🎯 Key Features

### Automatic Import on Connection
- When you connect Google Calendar, all your events are automatically imported to Appwrite
- Events are stored with their Google Calendar ID for future updates
- You can see all your Google events even when offline

### Smart Sync System
- **Auto-sync**: Optionally runs every X minutes (configurable, default 15 minutes)
- **Manual sync**: Click a button to sync on demand
- **Duplicate prevention**: Uses Google Calendar IDs to avoid creating duplicates
- **Source tracking**: Each event knows if it came from Google or was created in Focus Flow

### Efficient API Usage
- Google Calendar API is only called during sync operations
- All event displays use data from Appwrite (no API calls!)
- Background sync runs at intervals you control

## 📁 Files Modified

### 1. `/src/lib/appwrite.ts`
Added new fields to `AppwriteCalendarEvent`:
- `googleCalendarId` - ID of the event in Google Calendar
- `googleCalendarEtag` - For change tracking
- `source` - `'local'`, `'google'`, or `'synced'` 
- `lastSyncedAt` - Timestamp of last sync

### 2. `/src/lib/calendarSync.ts`
Enhanced the sync service:
- `initializeAutoSync()` - Imports all Google events on first connection
- `startAutoSync()` - Begins background periodic sync
- `stopAutoSync()` - Stops background sync
- Better duplicate detection using Google Calendar IDs
- Improved event type detection from Google events

### 3. `/src/contexts/CalendarContext.tsx`
Updated to:
- Automatically initialize sync when user logs in and Google is connected
- Clean up auto-sync when component unmounts
- Include sync fields in event creation/conversion

### 4. `/src/domain/models.ts`
Added sync fields to `CalendarEvent` interface

### 5. `/src/components/GoogleCalendarSettings.tsx`
Enhanced UI with:
- Sync status display (last sync time)
- Auto-sync toggle
- Manual "Sync Now" button
- Sync result statistics
- Better visual feedback

## 🚀 Setup Instructions

### Step 1: Fill in your `.env` file

You need to add your Appwrite credentials. Here's what you need:

```bash
# From Appwrite Console (https://cloud.appwrite.io/console)
VITE_APPWRITE_PROJECT_ID=your_project_id_here
VITE_APPWRITE_DATABASE_ID=your_database_id_here
APPWRITE_API_KEY=your_api_key_here

# Collection IDs (will be created by setup script)
VITE_APPWRITE_TASKS_COLLECTION_ID=tasks
VITE_APPWRITE_POMODORO_COLLECTION_ID=pomodoro_sessions
VITE_APPWRITE_NOTES_COLLECTION_ID=notes
VITE_APPWRITE_FOLDERS_COLLECTION_ID=folders
VITE_APPWRITE_SETTINGS_COLLECTION_ID=user_settings
VITE_APPWRITE_CALENDAR_EVENTS_COLLECTION_ID=calendar_events
VITE_APPWRITE_TIME_BLOCKS_COLLECTION_ID=time_blocks
VITE_APPWRITE_PRODUCTIVITY_GOALS_COLLECTION_ID=productivity_goals

# Google OAuth (if you have them)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_CALENDAR_CLIENT_ID=your_calendar_client_id
VITE_GOOGLE_CALENDAR_CLIENT_SECRET=your_calendar_client_secret
```

### Step 2: Run the Database Setup Scripts

```bash
# Install dependencies if you haven't
npm install

# Set up the initial database and collections
node setup-appwrite-db.js

# Add the new Google Calendar sync attributes
node add-calendar-sync-attributes.cjs
```

### Step 3: Restart Your Development Server

```bash
npm run dev
```

## 🎮 How to Use

### First Time Setup

1. **Go to Settings** in your app
2. **Navigate to Google Calendar section**
3. **Click "Connect Google Calendar"**
4. **Sign in with Google** and grant permissions
5. **Wait for initial sync** - all your Google events will be imported automatically!

### Daily Usage

- **View Events**: All events (Google + Focus Flow) appear in your calendar
- **Google events are marked** with a `source: "google"` field
- **Auto-sync runs** in the background if enabled (every 15 minutes by default)
- **Manual sync**: Click "Sync Now" button anytime
- **Create events in Focus Flow**: They'll sync to Google too (bidirectional)

### Sync Settings

In the Google Calendar Settings panel:

- ✅ **Auto-sync toggle**: Enable/disable automatic background sync
- ⏱️ **Sync interval**: Currently 15 minutes (customizable)
- 🔄 **Sync Now button**: Manually trigger a sync anytime
- 📊 **Sync status**: See when last synced and results

## 🔍 How It Works

### On Initial Connection:
```
User clicks "Connect Google Calendar"
  ↓
OAuth flow completes
  ↓
initializeAutoSync() runs
  ↓
Fetches ALL Google Calendar events (past & future)
  ↓
Stores each event in Appwrite with googleCalendarId
  ↓
Starts auto-sync timer (if enabled)
```

### On Periodic Sync:
```
Every 15 minutes (default)
  ↓
Fetch recent Google Calendar events
  ↓
For each event:
  - Check if googleCalendarId exists in Appwrite
  - If yes: update if changed
  - If no: create new event
  ↓
Update lastSyncTime
```

### On Display:
```
Calendar loads
  ↓
Fetches events from Appwrite (NO Google API call!)
  ↓
Displays all events (Google + local)
  ↓
Events work offline!
```

## 🎨 Event Source Indicators

Events are tagged with their source:

- **`source: 'local'`** - Created in Focus Flow
- **`source: 'google'`** - Imported from Google Calendar
- **`source: 'synced'`** - Was local, now synced to Google

You can use this to:
- Show different icons/colors for Google vs local events
- Filter events by source
- Prevent syncing certain types of events back to Google

## ⚡ Performance Benefits

Before this update:
- ❌ Every calendar view fetched from Google API
- ❌ Slow loading times
- ❌ Hit API rate limits
- ❌ No offline access

After this update:
- ✅ One-time import on connection
- ✅ Fast loading from Appwrite
- ✅ Periodic background sync (low API usage)
- ✅ Full offline access
- ✅ No rate limit issues

## 🛠️ Configuration Options

You can customize sync behavior in `calendarSyncService.getSyncSettings()`:

```typescript
{
  autoSync: true,           // Enable auto-sync
  autoLogSessions: true,    // Log pomodoro sessions
  syncInterval: 15,         // Minutes between syncs
  lastSyncTime: Date        // Last sync timestamp
}
```

To change sync interval, update the setting:

```typescript
calendarSyncService.updateSyncSettings({ 
  syncInterval: 30  // Change to 30 minutes
});
```

## 🐛 Troubleshooting

### Events not syncing?

1. Check Google Calendar connection in Settings
2. Click "Sync Now" to trigger manual sync
3. Check browser console for errors
4. Verify Appwrite credentials in `.env`

### Duplicate events?

- This shouldn't happen! Each event has a unique `googleCalendarId`
- If you see duplicates, try disconnecting and reconnecting Google Calendar

### Sync is slow?

- Initial sync imports ALL events (can take a minute)
- Subsequent syncs are faster (only recent changes)
- Check your Google Calendar event count

## 📝 Next Steps

1. **Fill in your `.env` file** with Appwrite credentials
2. **Run the setup scripts** to create database collections
3. **Add the new sync attributes** with the script I created
4. **Test the connection** by connecting Google Calendar
5. **Verify events appear** in your calendar view
6. **Enjoy automatic syncing!** 🎉

## 🎁 Bonus Features

The system also:

- ✅ Handles OAuth token refresh automatically
- ✅ Gracefully handles API errors
- ✅ Shows sync progress and results
- ✅ Persists tokens in Appwrite user preferences
- ✅ Works with all timezones
- ✅ Supports all-day events
- ✅ Preserves event metadata (location, attendees, etc.)

---

Need help? Check the browser console for detailed logging of sync operations!
