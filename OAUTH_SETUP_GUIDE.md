# Google OAuth Setup Guide

## Problem
Getting "User (role: guests) missing scopes" error when trying to sign in with Google.

## Solution

### Step 1: Configure Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add these EXACT URLs:

   For Local Development:
   ```
   http://localhost:5173/
   ```

   For Production (if deployed):
   ```
   https://yourdomain.com/
   ```

   **IMPORTANT**: Do NOT include `/auth/callback` - just use the root URL `/`

6. Click **Save**

### Step 2: Configure Appwrite Console

1. Go to: https://fra.cloud.appwrite.io/
2. Select your project (ID: 68d833cd002390a93c4c)
3. Navigate to: **Auth** → **Settings**
4. Scroll down to **OAuth2 Providers**
5. Find **Google** and click on it
6. Enable it and enter:
   - **App ID**: Your Google Client ID from step 1
     ```
     1035940077045-59uja9ulkfjstl9813kt1j5md4cga492.apps.googleusercontent.com
     ```
   - **App Secret**: Your Google Client Secret from step 1
     ```
     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
     ```
7. Click **Update**

### Step 3: Add Appwrite's Callback URL to Google

After configuring Appwrite, it will show you its callback URL. It should look like:
```
https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/68d833cd002390a93c4c
```

1. Copy this URL
2. Go back to Google Cloud Console → Credentials → Your OAuth Client
3. Add this URL to **Authorized redirect URIs**:
   ```
   https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/68d833cd002390a93c4c
   ```
4. Click **Save**

### Step 4: Test

1. Clear your browser cookies/cache or use incognito mode
2. Go to http://localhost:5173
3. Click "Sign in with Google"
4. Select your Google account
5. You should be redirected back and signed in successfully

### Troubleshooting

If you still get the error:

1. **Check Browser Console**: Look for detailed error messages
2. **Verify URLs match exactly**: No trailing slashes where there shouldn't be
3. **Wait a few minutes**: Changes in Google Cloud Console can take a few minutes to propagate
4. **Clear browser cache**: Sometimes old OAuth tokens cause issues
5. **Check Appwrite logs**: Go to your Appwrite project → **Auth** → **Users** to see if users are being created

### Common Issues

- ❌ **Wrong redirect URL**: Must match exactly (including http vs https, with/without trailing slash)
- ❌ **OAuth not enabled in Appwrite**: Must enable and configure Google OAuth in Appwrite Console
- ❌ **Missing Appwrite callback URL**: Must add Appwrite's callback URL to Google Console
- ❌ **Credentials not saved**: Make sure to click "Save" or "Update" in both consoles
