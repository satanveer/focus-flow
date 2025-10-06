# ✅ SOLUTION: Google OAuth 401 Unauthorized Fix

## The Problem

After clicking "Sign in with Google" and completing authentication, you get redirected back but see:
```
User (role: guests) missing scope (account) - 401 Unauthorized
```

## Root Cause

**Appwrite Cloud sets session cookies with domain `fra.cloud.appwrite.io`, but your app runs on `localhost`.** 

Modern browsers **block third-party cookies** by default, so the session cookie set by Appwrite during OAuth is not sent back with your API requests from localhost!

This is a known issue: https://github.com/appwrite/appwrite/issues/10207

## ✅ THE FIX: Use Token-Based OAuth

We've switched from cookie-based OAuth (`createOAuth2Session`) to token-based OAuth (`createOAuth2Token`). This avoids the cross-domain cookie issue completely!

### Step 1: Update Google Cloud Console Redirect URIs

**CRITICAL**: You must update the redirect URIs in Google Console!

1. Go to https://console.cloud.google.com/
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, make sure you have:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5174/auth/callback
   https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/68d833cd002390a93c4c
   ```
5. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost
   http://localhost:5173
   http://localhost:5174
   ```
6. Click **Save**
7. **Wait 2-3 minutes** for changes to propagate

### Step 2: Verify Google OAuth Settings

While you're in the Appwrite Console:

1. Go to **Auth** → **Settings**
2. Scroll to **OAuth2 Providers**
3. Find **Google**
4. Make sure it shows:
   - ✅ **Enabled** (toggle is ON)
   - ✅ **App ID**: `1035940077045-59uja9ulkfjstl9813kt1j5md4cga492.apps.googleusercontent.com`
   - ✅ **App Secret**: `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`

### Step 3: Update Google Cloud Console

Go to https://console.cloud.google.com/ → APIs & Services → Credentials

**Authorized JavaScript origins**:
```
http://localhost
http://localhost:5173
http://localhost:5174
```

**Authorized redirect URIs**:
```
http://localhost:5173/
http://localhost:5174/
https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/68d833cd002390a93c4c
```

### Step 4: Clear Browser Data & Test

1. **Close ALL browser tabs** of your app
2. **Clear browser cookies** for both `localhost` AND `fra.cloud.appwrite.io`
3. Or just use **Incognito/Private window** (easiest!)
4. Go to `http://localhost:5173`
5. Click "Sign in with Google"
6. Complete authentication
7. You should now be logged in! ✅

## Why This Works

Adding `localhost` as a platform in Appwrite tells it to:
1. **Allow CORS requests** from `localhost`
2. **Set cookies** that work with `localhost`
3. **Trust the origin** for OAuth callbacks

Without this, Appwrite treats `localhost` as an untrusted third-party domain.

## Alternative: Use Self-Hosted Appwrite

If the platform fix doesn't work, you can:
1. Install Appwrite locally with Docker
2. Run it on `localhost:80`
3. This avoids the cross-domain cookie issue entirely

## Verify It's Working

After fixing, you should see in browser console:
```
🔍 Checking for existing sessions...
🔍 No existing session found (this is good)
🔍 Starting Google OAuth with success URL: http://localhost:5173/
[redirects to Google]
[redirects back]
🔍 OAuth callback detected (session-based) - Appwrite should have set session cookies
🔍 Attempt 1/10 to get authenticated user...
🔍 ✅ Active session found: [session-id]
✅ OAuth authentication successful: your@email.com
```

## Still Not Working?

If you STILL get 401 after adding the platform:

1. **Check browser console** → Application → Cookies
2. Look for cookies from `fra.cloud.appwrite.io`
3. If you see NO cookies after OAuth, it's a browser cookie blocking issue
4. Try:
   - Different browser (Chrome, Firefox, Edge)
   - Disable browser extensions (especially privacy/ad blockers)
   - Check browser settings allow third-party cookies for Appwrite domain

## References

- Appwrite Issue: https://github.com/appwrite/appwrite/issues/10207
- Appwrite Docs: https://appwrite.io/docs/products/auth/oauth2
