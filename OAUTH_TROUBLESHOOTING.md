# Google OAuth Troubleshooting Guide

## The Problem You're Experiencing

**Error**: "User (role: guests) missing scopes"
**What's happening**: After clicking "Sign in with Google" and selecting your account, you get redirected back but are not logged in.

## Root Cause (from Appwrite Discord)

This is a **known issue** where an old/cached session interferes with new OAuth sessions. Even though you're not logged in visibly, Appwrite has a "guest" session cached that prevents the new OAuth session from being created.

## Solutions (Try in Order)

### Solution 1: Use Incognito/Private Window ✅ RECOMMENDED

1. Open a **new incognito/private browser window**
2. Go to `http://localhost:5173`
3. Click "Sign in with Google"
4. Complete the Google authentication
5. You should be successfully logged in

**Why this works**: Incognito mode doesn't have any cached sessions.

### Solution 2: Clear All Browser Data

1. Open your browser's Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Clear:
   - ✅ Cookies (especially `fra.cloud.appwrite.io` domain)
   - ✅ Local Storage
   - ✅ Session Storage
   - ✅ Cache
4. Refresh the page and try signing in again

### Solution 3: Manual Session Cleanup

Run this in your browser console before clicking "Sign in with Google":

```javascript
// Clear all local storage
localStorage.clear();

// Clear all session storage  
sessionStorage.clear();

// Clear Appwrite cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log("✅ All data cleared - now try signing in");
```

### Solution 4: Force Logout Before OAuth (Already Implemented)

The code has been updated to automatically delete any existing session before starting OAuth. This should happen automatically now.

## Required Configuration

### Google Cloud Console Settings

**URL**: https://console.cloud.google.com/

Navigate to: **APIs & Services** → **Credentials** → Your OAuth 2.0 Client ID

**Authorized redirect URIs** must include:
```
http://localhost:5173/
http://localhost:5174/
https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/68d833cd002390a93c4c
```

**Authorized JavaScript origins**:
```
http://localhost:5173
http://localhost:5174
```

### Appwrite Console Settings

**URL**: https://fra.cloud.appwrite.io/

Navigate to: Your Project → **Auth** → **Settings** → **OAuth2 Providers**

1. Find **Google** in the list
2. Click to expand
3. **Enable** the toggle
4. Enter your **App ID** (Google Client ID):
   ```
   1035940077045-59uja9ulkfjstl9813kt1j5md4cga492.apps.googleusercontent.com
   ```
5. Enter your **App Secret** (Google Client Secret):
   ```
   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
   ```
6. Click **Update**

## Debugging Checklist

When you click "Sign in with Google", open the browser console and check for:

1. ✅ `🔍 Checking for existing sessions...`
2. ✅ `🔍 Starting Google OAuth with success URL: http://localhost:5173/`
3. After redirect back from Google:
4. ✅ `🔍 OAuth callback detected (session-based)`
5. ✅ `🔍 ✅ Active session found`
6. ✅ `✅ OAuth authentication successful: your@email.com`

If you see errors at any step, that tells you where the problem is.

## Common Issues

### Issue 1: "Missing userId or secret in OAuth callback"
**Fix**: This is expected. Appwrite uses session cookies, not URL parameters. The code handles this.

### Issue 2: "OAuth session creation failed after X attempts"
**Fix**: 
- Check redirect URLs match EXACTLY in Google Console
- Make sure Google OAuth is enabled in Appwrite Console
- Clear browser cache and try in incognito

### Issue 3: Redirected but not authenticated
**Fix**: Old session is cached. Use incognito mode or clear all browser data.

### Issue 4: "401 Unauthorized" when checking session
**Fix**: The session wasn't created by Appwrite. Check:
- Google OAuth credentials are correct in Appwrite
- Redirect URLs match in both consoles
- You approved the Google consent screen

## Test OAuth is Working

1. Open **Incognito Window**
2. Go to `http://localhost:5173`
3. Open **Developer Console** (F12)
4. Click "Sign in with Google"
5. Watch console logs with 🔍 emoji
6. Complete Google sign-in
7. Should see: `✅ OAuth authentication successful`

## Still Not Working?

If none of the above works:

1. **Double-check redirect URLs** - they must match EXACTLY
2. **Wait 2-3 minutes** after changing Google Console settings
3. **Try a different browser** completely
4. **Check Appwrite project ID** matches in `.env` file: `68d833cd002390a93c4c`
5. **Verify Google OAuth is enabled** in Appwrite Console (toggle should be ON)

## Success Indicators

You'll know it's working when:
- No alert messages appear
- You see the app dashboard after Google sign-in
- Browser console shows: `✅ OAuth authentication successful`
- You can see your user in Appwrite Console → Auth → Users
