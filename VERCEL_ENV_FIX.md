# Vercel Environment Variables Fix

## Issue
The Google Calendar OAuth is showing error "invalid_client" with client ID `019365997607...` instead of `1019365997607...` (missing leading "1").

## Root Cause
The environment variable `VITE_GOOGLE_CALENDAR_CLIENT_ID` on Vercel is either:
1. Not set at all, or
2. Set incorrectly without the leading "1", or
3. Being treated as a number and losing the leading zero

## Solution

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/
2. Select your project: **focus-flow**
3. Go to **Settings** > **Environment Variables**

### Step 2: Update/Add the Google Calendar Client ID
Look for `VITE_GOOGLE_CALENDAR_CLIENT_ID` and set it to:
```
1019365997607-62sp6hrpd4jhb55no8ia25ln1e2sjf70.apps.googleusercontent.com
```

**IMPORTANT:** Make sure to:
- ✅ Set it as a **String** (not a number)
- ✅ Include the full value with the leading "1"
- ✅ Select all environments: Production, Preview, Development

### Step 3: Verify All Required Environment Variables
Make sure these are all set on Vercel:

```bash
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68d833cd002390a93c4c
VITE_APPWRITE_DATABASE_ID=68d834c00022954c22ff

# Collection IDs
VITE_APPWRITE_TASKS_COLLECTION_ID=tasks
VITE_APPWRITE_POMODORO_COLLECTION_ID=pomodoro_sessions
VITE_APPWRITE_NOTES_COLLECTION_ID=notes
VITE_APPWRITE_FOLDERS_COLLECTION_ID=folders
VITE_APPWRITE_SETTINGS_COLLECTION_ID=user_settings
VITE_APPWRITE_CALENDAR_EVENTS_COLLECTION_ID=calendar_events
VITE_APPWRITE_TIME_BLOCKS_COLLECTION_ID=time_blocks
VITE_APPWRITE_PRODUCTIVITY_GOALS_COLLECTION_ID=productivity_goals

# Google OAuth Authentication Credentials
VITE_GOOGLE_CLIENT_ID=1035940077045-59uja9ulkfjstl9813kt1j5md4cga492.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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

# Google Calendar Integration Credentials (THIS ONE IS CRITICAL!)
VITE_GOOGLE_CALENDAR_CLIENT_ID=1019365997607-62sp6hrpd4jhb55no8ia25ln1e2sjf70.apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_CLIENT_SECRET=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
```

### Step 4: Redeploy
After updating the environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click the **⋮** menu (three dots)
4. Select **Redeploy**
5. Make sure "Use existing Build Cache" is **UNCHECKED**
6. Click **Redeploy**

## Verification
After redeployment, test by:
1. Clearing browser cache or using incognito mode
2. Going to https://focus-flow-eosin.vercel.app
3. Click "Sign in with Google"
4. You should NOT see the "invalid_client" error anymore

## Fixed Issues
✅ Database attribute `calendarDefaultView` added (no more 400 errors on user registration)
✅ Environment variable instructions provided (fix for invalid_client error)

## Notes
- The main OAuth (1035940077045...) is working fine
- The issue is specifically with the Google Calendar OAuth (1019365997607...)
- Both need to be set correctly on Vercel for the app to work properly
