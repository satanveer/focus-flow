# Content Security Policy Fix for Appwrite Regional Endpoints

## Issue
Google OAuth sign-in was failing in production with this error:
```
Connecting to 'https://fra.cloud.appwrite.io/v1/account' violates the following Content Security Policy directive: "connect-src 'self' https://cloud.appwrite.io https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com".
```

## Root Cause
Appwrite uses regional subdomains (e.g., `fra.cloud.appwrite.io` for Frankfurt, `nyc.cloud.appwrite.io` for New York, etc.), but the CSP only allowed the generic `cloud.appwrite.io`.

## Solution
Updated the `connect-src` directive in CSP to include wildcard for all Appwrite regional endpoints:

**Before:**
```
connect-src 'self' https://cloud.appwrite.io https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com
```

**After:**
```
connect-src 'self' https://cloud.appwrite.io https://*.cloud.appwrite.io https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com
```

## Files Updated

1. **`netlify/_headers`** - For Netlify deployment
2. **`vercel.json`** - For Vercel deployment

Both files now include `https://*.cloud.appwrite.io` to allow connections to any Appwrite regional endpoint.

## Deployment

After deploying these changes, Google OAuth should work correctly in production regardless of which Appwrite region your instance is in.

### For Netlify:
```bash
git add netlify/_headers
git commit -m "fix: update CSP to allow Appwrite regional endpoints"
git push
```

### For Vercel:
```bash
git add vercel.json
git commit -m "fix: update CSP to allow Appwrite regional endpoints"
git push
```

Vercel and Netlify will automatically deploy the updated headers.

## Testing

After deployment, test Google sign-in:
1. Open your production site
2. Click "Sign in with Google"
3. Should now work without CSP errors
4. Check browser console - no CSP violations for `fra.cloud.appwrite.io`

## Security Note

The wildcard `https://*.cloud.appwrite.io` only matches Appwrite's official cloud subdomains, maintaining security while allowing flexibility for regional deployments.
