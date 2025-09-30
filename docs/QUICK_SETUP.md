# 🚀 Quick Appwrite Setup Guide

## **No Manual Database Creation Needed!** 

Instead of manually clicking through the Appwrite console, use this automated setup script that creates everything from JSON configurations.

## Step 1: Create Appwrite Project

1. **Go to** [cloud.appwrite.io](https://cloud.appwrite.io)
2. **Sign in** with GitHub (to get Education Pack benefits)
3. **Create new project**: `focusflow-prod`
4. **Copy the Project ID**

## Step 2: Get API Key

1. In Appwrite console → **Settings** → **View API Keys**
2. **Create new key** with these scopes:
   - `databases.read`
   - `databases.write` 
   - `collections.read`
   - `collections.write`
   - `attributes.read`
   - `attributes.write`
   - `indexes.read`
   - `indexes.write`
3. **Copy the API Key**

## Step 3: Update Environment Variables

Check your current `.env` file and update it with your Appwrite credentials:

```env
# Appwrite Configuration  
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
VITE_APPWRITE_DATABASE_ID=focusflow-main

# Server API Key (for setup script only)
APPWRITE_API_KEY=your_server_api_key_here

# Collection IDs (will be auto-generated)
VITE_APPWRITE_TASKS_COLLECTION_ID=tasks
VITE_APPWRITE_POMODORO_COLLECTION_ID=pomodoro_sessions
VITE_APPWRITE_NOTES_COLLECTION_ID=notes
VITE_APPWRITE_FOLDERS_COLLECTION_ID=folders
VITE_APPWRITE_SETTINGS_COLLECTION_ID=user_settings
```

## Step 4: Run Automated Setup

```bash
npm run setup-appwrite
```

**This script will automatically:**
- ✅ Create the database
- ✅ Create all 5 collections (tasks, sessions, notes, folders, settings)
- ✅ Add all attributes with correct types and constraints  
- ✅ Create optimized indexes for performance
- ✅ Set up proper permissions
- ✅ Update your .env file

## Step 5: Configure Authentication

1. **In Appwrite console** → **Auth**
2. **Enable Email/Password** authentication
3. **Optional**: Enable OAuth providers (Google, GitHub)

## Step 6: Test the Setup

```bash
npm run dev
```

The app should now connect to Appwrite instead of localStorage!

---

## 🎯 **Advantages of This Approach:**

✅ **No Manual Work**: Everything created automatically from code
✅ **No Mistakes**: Consistent schema every time  
✅ **Version Controlled**: Schema changes tracked in git
✅ **Repeatable**: Can recreate database anytime
✅ **Fast**: Takes ~2 minutes vs ~30 minutes manual setup

## 🔧 **What the Script Creates:**

### Collections Created:
1. **tasks** - User tasks with priorities, tags, due dates
2. **pomodoro_sessions** - Focus sessions with timing data
3. **notes** - Hierarchical notes system
4. **folders** - Note organization folders
5. **user_settings** - User preferences and configuration

### Performance Features:
- **Optimized Indexes**: Fast queries for user data
- **Proper Types**: Validation and type safety
- **Security**: User-level permissions on all data
- **Relationships**: Linked data between tasks, notes, and sessions

Ready to run the setup? Just update your `.env` file and run `npm run setup-appwrite`! 🚀