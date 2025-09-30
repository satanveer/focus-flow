# FocusFlow Deployment Guide

## 🚀 Quick Deploy to Production

### Prerequisites
- Node.js 18+ installed
- Appwrite Cloud account or self-hosted instance
- Production domain/hosting ready

### 1. Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure production variables:**
   ```bash
   # Appwrite Configuration
   VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_production_project_id
   VITE_APPWRITE_DATABASE_ID=your_production_database_id
   
   # Collection IDs (auto-created by setup script)
   VITE_APPWRITE_TASKS_COLLECTION_ID=tasks
   VITE_APPWRITE_POMODORO_COLLECTION_ID=pomodoro_sessions
   VITE_APPWRITE_NOTES_COLLECTION_ID=notes
   VITE_APPWRITE_FOLDERS_COLLECTION_ID=folders
   VITE_APPWRITE_SETTINGS_COLLECTION_ID=user_settings
   
   # Server API Key (from Appwrite console)
   APPWRITE_API_KEY=your_production_api_key
   
   # Google OAuth (from Google Cloud Console)
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### 2. Appwrite Backend Setup

1. **Run automated setup:**
   ```bash
   npm run setup-appwrite
   ```

2. **Verify setup:**
   ```bash
   npm run check-appwrite
   ```

3. **Configure authentication in Appwrite Console:**
   - Enable Email/Password authentication
   - Add Google OAuth provider with your production domain
   - Set session duration to 30 days
   - Configure email verification (recommended)

### 3. Build & Deploy

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Test production build locally:**
   ```bash
   npm run preview
   ```

4. **Deploy to hosting platform:**

   **Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```
   
   **Netlify:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```
   
   **Static hosting:**
   - Upload the `dist/` folder to your web server
   - Configure your server to serve `index.html` for all routes (SPA routing)

### 4. Post-Deployment Configuration

1. **Update Appwrite domain whitelist:**
   - Add your production domain to OAuth redirect URLs
   - Update CORS settings if needed

2. **Set up monitoring:**
   - Configure error tracking
   - Set up performance monitoring
   - Enable security headers

## 🏗️ Platform-Specific Instructions

### Vercel Deployment

1. **Create `vercel.json`:**
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "X-Frame-Options", "value": "DENY" },
           { "key": "X-Content-Type-Options", "value": "nosniff" },
           { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
         ]
       }
     ]
   }
   ```

2. **Set environment variables in Vercel dashboard**

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Netlify Deployment

1. **Create `_redirects` file in `public/`:**
   ```
   /*    /index.html   200
   ```

2. **Create `netlify.toml`:**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Cloudflare Pages

1. **Connect repository to Cloudflare Pages**
2. **Set build configuration:**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Add environment variables in dashboard**

## 🔧 Environment Variables

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APPWRITE_ENDPOINT` | Appwrite API endpoint | `https://fra.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Your Appwrite project ID | `64f8a2b3c4d5e6f7` |
| `VITE_APPWRITE_DATABASE_ID` | Your database ID | `64f8a2b3c4d5e6f8` |
| `APPWRITE_API_KEY` | Server-side API key | `standard_xyz...` |

### Optional Variables
| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

## 🚨 Security Checklist

- [ ] Environment variables configured in hosting platform (not in code)
- [ ] `.env` file in `.gitignore` 
- [ ] HTTPS enabled on production domain
- [ ] Security headers configured
- [ ] Google OAuth redirect URLs updated for production domain
- [ ] Appwrite permissions properly configured
- [ ] API keys rotated and secured

## 📊 Performance Optimization

### Bundle Analysis
Current optimized bundle sizes:
- Main app: ~336KB (52% reduction from original 707KB)
- Charts (lazy): ~348KB (loaded only when needed)
- React vendor: ~45KB (cached across pages)

### Optimization Features
- ✅ Code splitting with lazy-loaded chart components
- ✅ React.memo for frequently re-rendered components
- ✅ Manual chunk configuration for optimal caching
- ✅ Tree shaking for unused code elimination

## 🛠️ Troubleshooting

### Common Issues

1. **Build fails with TypeScript errors:**
   ```bash
   npm run lint
   # Fix any TypeScript issues shown
   ```

2. **Authentication not working:**
   - Verify domain is whitelisted in Appwrite
   - Check OAuth redirect URLs
   - Ensure API keys are correct

3. **Charts not loading:**
   - Verify lazy loading is working
   - Check browser console for errors
   - Ensure Recharts is properly installed

4. **Environment variables not working:**
   - Ensure variables are prefixed with `VITE_` for client-side access
   - Restart dev server after adding new variables
   - Check hosting platform environment variable configuration

### Support

For deployment issues:
1. Check the browser console for errors
2. Verify Appwrite service status
3. Test with a fresh Appwrite project if needed
4. Review the security and setup documentation

## 🔄 Updates & Maintenance

### Regular Tasks
- Monitor bundle sizes with each update
- Keep dependencies updated (`npm audit`)
- Rotate API keys periodically
- Review Appwrite logs for unusual activity
- Test authentication flows after OAuth provider updates

### Performance Monitoring
- Use Lighthouse for regular performance audits
- Monitor Core Web Vitals
- Track bundle size changes
- Review error rates and user feedback