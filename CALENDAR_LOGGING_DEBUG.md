# Calendar Logging Debug Guide

## What Was Fixed

### 1. Internal Calendar Logging
**Problem**: Focus sessions weren't appearing in the app's calendar
**Root Causes**:
- Missing user authentication check
- No error logging to identify issues

**Solution**:
- Added authentication check: Only logs if `user?.$id` exists
- Added detailed console logging with error details
- Improved duration formatting (hours + minutes)

### 2. Google Calendar Event Format
**Problem**: Events showed "0 minutes" and generic "Focus Session" title
**Root Causes**:
- Task title wasn't being prioritized
- Duration formatting was correct but may show 0 if session is very short

**Solution**:
- Task title now becomes the event title (e.g., "🎯 Write Documentation")
- Changed description from "**Task:**" to "**Task Completed:**" for clarity
- Better duration display (e.g., "25 minutes", "1h 30m")

## How to Test

### Step 1: Check Authentication
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Make sure you're logged in to the app
4. Check console for: `"User authenticated: <userId>"`

### Step 2: Complete a Focus Session
1. Create a task (e.g., "Write Documentation")
2. Start a Pomodoro timer WITH that task selected
3. Let it run for at least 1 minute (or force complete it)
4. Watch the console for these messages:

**Expected Success Logs:**
```
✅ Focus session logged to internal calendar: Write Documentation
✅ Focus session logged to Google Calendar: Write Documentation
```

**If Internal Calendar Fails:**
```
⚠️ Cannot log to internal calendar: User not authenticated
// OR
Failed to log to internal calendar: <error details>
```

### Step 3: Verify in Calendar
1. Go to Calendar page in the app
2. Look for an event with:
   - **Title**: "Write Documentation" (your task name)
   - **Time**: The time your session completed
   - **Type**: Focus session (purple/blue color)

3. Hover over the event to see the enhanced tooltip showing:
   - Duration (e.g., "25 min")
   - Task details
   - Status badge

### Step 4: Check Google Calendar
1. Open Google Calendar (calendar.google.com)
2. Find the event at the same time
3. Event should show:
   - **Title**: "🎯 Write Documentation"
   - **Description**: 
     ```
     🎯 **Deep Focus Session**
     
     **Duration:** 25 minutes
     **Task Completed:** Write Documentation
     
     ---
     📊 Logged automatically by Focus Flow
     💡 Track your productivity and build momentum towards your goals!
     ```

## Troubleshooting

### Issue: "0 minutes" in Google Calendar
**Cause**: Session duration is less than 1 minute
**Solution**: 
- Make sure the timer runs for at least 1 minute
- Or check if `sessionData.durationSec` is being passed correctly
- Console should show: `"Duration: X minutes"` in the log

### Issue: Nothing appears in internal calendar
**Check**:
1. Console for authentication warning
2. Console for error details
3. Make sure you're logged in (check top-right corner for user name)
4. Try logging out and back in
5. Check Network tab for failed API calls to Appwrite

### Issue: Generic "Focus Session" title instead of task name
**Cause**: No task was selected when starting the timer
**Solution**: 
- Make sure to select a task BEFORE starting the Pomodoro
- Or create a task first, then link it to the timer

## Console Commands for Debugging

Open browser console and run:

```javascript
// Check if user is authenticated
console.log('User:', window.localStorage.getItem('appwrite-user'));

// Check logged sessions (to see if duplicates are being prevented)
console.log('Logged sessions:', JSON.parse(localStorage.getItem('logged_sessions') || '[]'));

// Clear logged sessions (if you want to re-test)
localStorage.setItem('logged_sessions', '[]');
```

## Expected Event Data Structure

### Internal Calendar Event:
```json
{
  "title": "Write Documentation",
  "description": "🎯 **Deep Focus Session**\n\n**Duration:** 25 minutes\n**Task:** Write Documentation\n📊 Logged automatically by Focus Flow",
  "type": "focus",
  "status": "completed",
  "focusDuration": 1500,
  "actualFocusTime": 1500,
  "source": "local",
  "userId": "user123..."
}
```

### Google Calendar Event:
```json
{
  "summary": "🎯 Write Documentation",
  "description": "🎯 **Deep Focus Session**\n\n**Duration:** 25 minutes\n**Task Completed:** Write Documentation\n\n---\n📊 Logged automatically by Focus Flow",
  "start": { "dateTime": "2025-11-13T15:53:00Z" },
  "end": { "dateTime": "2025-11-13T16:18:00Z" },
  "colorId": "2"
}
```

## What Changed in the Code

### `/src/features/pomodoro/PomodoroContext.tsx`
- Added user authentication check before creating internal calendar events
- Added detailed error logging with try-catch
- Improved duration formatting (hours + minutes)
- Added explicit console logs for debugging
- Pass `title: taskTitle` to Google Calendar event creation

### `/src/lib/googleCalendar.ts`
- Changed event title priority: `taskTitle` → `title` → "Focus Session"
- Changed description label from "**Task:**" to "**Task Completed:**"
- Ensures task title is always used as the event title when available

## Next Steps

If issues persist:
1. Share console logs (all messages starting with ✅, ⚠️, or ❌)
2. Check Network tab for failed API requests
3. Verify user authentication status
4. Check if tasks are properly linked to Pomodoro sessions
