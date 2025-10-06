# Production Deployment Checklist

## ✅ Before Pushing to Production

### 1. Add Production Domain to Appwrite Console

1. Go to https://fra.cloud.appwrite.io/
2. Select your project (ID: `68d833cd002390a93c4c`)
3. Navigate to **Settings** → **Platforms**
4. Click **"Add Platform"** → Select **"Web App"**
5. Add your Vercel production domain:
   - **Name**: `FocusFlow Production`
   - **Hostname**: `your-app-name.vercel.app` (or your custom domain)
6. Click **Add**

### 2. Update Google Cloud Console

Go to https://console.cloud.google.com/ → APIs & Services → Credentials

#### Add Production Authorized JavaScript Origins:
```
https://your-app-name.vercel.app
```

#### Add Production Authorized Redirect URIs:
```
https://your-app-name.vercel.app/auth/callback
https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/68d833cd002390a93c4c
```

**Keep the localhost URLs for development!**

### 3. Set Environment Variables in Vercel

Go to your Vercel project dashboard:

1. Navigate to **Settings** → **Environment Variables**
2. Add ALL variables from your `.env` file:

```bash
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68d833cd002390a93c4c
VITE_APPWRITE_DATABASE_ID=68d834c00022954c22ff

VITE_APPWRITE_TASKS_COLLECTION_ID=tasks
VITE_APPWRITE_POMODORO_COLLECTION_ID=pomodoro_sessions
VITE_APPWRITE_NOTES_COLLECTION_ID=notes
VITE_APPWRITE_FOLDERS_COLLECTION_ID=folders
VITE_APPWRITE_SETTINGS_COLLECTION_ID=user_settings

VITE_GOOGLE_CLIENT_ID=1035940077045-59uja9ulkfjstl9813kt1j5md4cga492.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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

VITE_GOOGLE_CALENDAR_CLIENT_ID=1019365997607-62sp6hrpd4jhb55no8ia25ln1e2sjf70.apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_CLIENT_SECRET=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
```

**IMPORTANT**: DO NOT commit the `APPWRITE_API_KEY` to production! This is only for server-side operations.

### 4. Update .gitignore

Make sure `.env` is in `.gitignore`:

```
.env
.env.local
.env.production
.env.*.local
```

### 5. Push to GitHub

```bash
git add .
git commit -m "🚀 Production Release: Google OAuth working with token-based auth"
git push origin main
```

Vercel will automatically deploy!

### 6. Test Production Deployment

After Vercel deploys:

1. Go to your production URL: `https://your-app-name.vercel.app`
2. Click "Sign in with Google"
3. Verify OAuth works in production
4. Check browser console for any errors

## 🔒 Security Notes

### DO NOT commit to Git:
- ✅ `.env` is already in `.gitignore`
- ✅ Never commit `APPWRITE_API_KEY` (server-side only)

### Production Environment Variables in Vercel:
- All `VITE_*` variables must be in Vercel's environment settings
- Vercel will inject them at build time
- They will be public in the built JavaScript (that's okay for `VITE_*` vars)

## 📝 Quick Push Commands

```bash
# Check what will be committed
git status

# Add all changes
git add .

# Commit with a message
git commit -m "🚀 Production ready: OAuth fixed"

# Push to GitHub (Vercel auto-deploys)
git push origin main
```

## 🎯 After Deployment

1. **Check Vercel Dashboard** for build logs
2. **Visit production URL** and test sign-in
3. **Check Appwrite Console** → Auth → Users to see new production users
4. **Monitor errors** in Vercel logs if any issues

## ⚠️ Common Production Issues

### Issue: "OAuth redirect_uri_mismatch"
**Fix**: Make sure you added your Vercel URL to Google Console redirect URIs

### Issue: "401 Unauthorized" in production
**Fix**: Add production domain to Appwrite Platforms

### Issue: Environment variables not loading
**Fix**: 
1. Check they're prefixed with `VITE_`
2. Redeploy in Vercel after adding them
3. Build will fail if required vars are missing

## 🎉 Success Indicators

After deployment, you should see:
- ✅ App loads without errors
- ✅ Google Sign-In button works
- ✅ OAuth redirects successfully
- ✅ User can access dashboard after login
- ✅ No console errors related to Appwrite or OAuth

## 🔄 Future Updates

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel automatically rebuilds and deploys!
