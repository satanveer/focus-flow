# FocusFlow - Appwrite Backend Setup Guide

## 🚀 Production-Grade Appwrite Integration

This guide will help you set up Appwrite as the backend for FocusFlow with enterprise-level security and efficiency.

## Prerequisites

- [Appwrite Cloud Account](https://cloud.appwrite.io) (Free with GitHub Education Pack)
- GitHub Education Pack activated
- Node.js 18+ installed

## 1. Create Appwrite Project

1. **Sign up for Appwrite Cloud**
   - Visit [cloud.appwrite.io](https://cloud.appwrite.io)
   - Sign in with GitHub (to access Education Pack benefits)
   - Create a new project: `focusflow-prod`

2. **Get Project ID**
   - Copy your Project ID from the Appwrite console
   - Add to `.env` file: `VITE_APPWRITE_PROJECT_ID=your_project_id`

## 2. Create Database & Collections

### Create Database
1. Go to **Databases** in Appwrite console
2. Create new database: `focusflow-main`
3. Copy Database ID to `.env`: `VITE_APPWRITE_DATABASE_ID=your_database_id`

### Create Collections

#### Collection 1: `tasks`
```json
{
  "collectionId": "tasks",
  "name": "Tasks",
  "permissions": ["read(\"user\")", "write(\"user\")"],
  "attributes": [
    {
      "key": "title",
      "type": "string",
      "size": 500,
      "required": true
    },
    {
      "key": "description", 
      "type": "string",
      "size": 2000,
      "required": false
    },
    {
      "key": "priority",
      "type": "enum",
      "elements": ["low", "medium", "high"],
      "required": true,
      "default": "medium"
    },
    {
      "key": "tags",
      "type": "string",
      "array": true,
      "required": false
    },
    {
      "key": "dueDate",
      "type": "datetime",
      "required": false
    },
    {
      "key": "completed",
      "type": "boolean",
      "required": true,
      "default": false
    },
    {
      "key": "focusSeconds",
      "type": "integer",
      "required": true,
      "default": 0
    },
    {
      "key": "userId",
      "type": "string",
      "size": 36,
      "required": true
    }
  ],
  "indexes": [
    {
      "key": "user_tasks",
      "type": "key",
      "attributes": ["userId"]
    },
    {
      "key": "user_completed",
      "type": "key", 
      "attributes": ["userId", "completed"]
    },
    {
      "key": "user_priority",
      "type": "key",
      "attributes": ["userId", "priority"]
    }
  ]
}
```

#### Collection 2: `pomodoro_sessions`
```json
{
  "collectionId": "pomodoro_sessions",
  "name": "Pomodoro Sessions",
  "permissions": ["read(\"user\")", "write(\"user\")"],
  "attributes": [
    {
      "key": "mode",
      "type": "enum", 
      "elements": ["focus", "shortBreak", "longBreak"],
      "required": true
    },
    {
      "key": "durationSec",
      "type": "integer",
      "required": true
    },
    {
      "key": "startedAt",
      "type": "datetime",
      "required": true
    },
    {
      "key": "endedAt",
      "type": "datetime",
      "required": false
    },
    {
      "key": "aborted",
      "type": "boolean",
      "required": false,
      "default": false
    },
    {
      "key": "taskId",
      "type": "string",
      "size": 36,
      "required": false
    },
    {
      "key": "userId",
      "type": "string", 
      "size": 36,
      "required": true
    }
  ],
  "indexes": [
    {
      "key": "user_sessions",
      "type": "key",
      "attributes": ["userId"]
    },
    {
      "key": "user_task_sessions",
      "type": "key",
      "attributes": ["userId", "taskId"]
    },
    {
      "key": "user_mode_sessions",
      "type": "key",
      "attributes": ["userId", "mode"]
    }
  ]
}
```

#### Collection 3: `notes`
```json
{
  "collectionId": "notes",
  "name": "Notes",
  "permissions": ["read(\"user\")", "write(\"user\")"],
  "attributes": [
    {
      "key": "title",
      "type": "string",
      "size": 500,
      "required": true
    },
    {
      "key": "body",
      "type": "string",
      "size": 100000,
      "required": false
    },
    {
      "key": "folderId",
      "type": "string",
      "size": 36,
      "required": false
    },
    {
      "key": "taskId",
      "type": "string", 
      "size": 36,
      "required": false
    },
    {
      "key": "userId",
      "type": "string",
      "size": 36,
      "required": true
    }
  ],
  "indexes": [
    {
      "key": "user_notes",
      "type": "key",
      "attributes": ["userId"]
    },
    {
      "key": "user_folder_notes",
      "type": "key",
      "attributes": ["userId", "folderId"]
    },
    {
      "key": "user_task_notes",
      "type": "key",
      "attributes": ["userId", "taskId"]
    }
  ]
}
```

#### Collection 4: `folders`
```json
{
  "collectionId": "folders",
  "name": "Folders", 
  "permissions": ["read(\"user\")", "write(\"user\")"],
  "attributes": [
    {
      "key": "name",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "parentId",
      "type": "string",
      "size": 36,
      "required": false
    },
    {
      "key": "userId",
      "type": "string",
      "size": 36,
      "required": true
    }
  ],
  "indexes": [
    {
      "key": "user_folders",
      "type": "key",
      "attributes": ["userId"]
    },
    {
      "key": "user_parent_folders",
      "type": "key",
      "attributes": ["userId", "parentId"]
    }
  ]
}
```

#### Collection 5: `user_settings`
```json
{
  "collectionId": "user_settings",
  "name": "User Settings",
  "permissions": ["read(\"user\")", "write(\"user\")"],
  "attributes": [
    {
      "key": "theme",
      "type": "enum",
      "elements": ["light", "dark", "system"],
      "required": true,
      "default": "system"
    },
    {
      "key": "focusDuration",
      "type": "integer",
      "required": true,
      "default": 1500
    },
    {
      "key": "shortBreakDuration", 
      "type": "integer",
      "required": true,
      "default": 300
    },
    {
      "key": "longBreakDuration",
      "type": "integer",
      "required": true, 
      "default": 900
    },
    {
      "key": "autoStartNext",
      "type": "boolean",
      "required": true,
      "default": false
    },
    {
      "key": "goalMinutes",
      "type": "integer",
      "required": true,
      "default": 120
    },
    {
      "key": "longBreakEvery",
      "type": "integer", 
      "required": true,
      "default": 4
    },
    {
      "key": "enableSound",
      "type": "boolean",
      "required": true,
      "default": true
    },
    {
      "key": "enableNotifications",
      "type": "boolean",
      "required": true,
      "default": false
    },
    {
      "key": "userId",
      "type": "string",
      "size": 36,
      "required": true
    }
  ],
  "indexes": [
    {
      "key": "user_settings_unique",
      "type": "unique",
      "attributes": ["userId"]
    }
  ]
}
```

## 3. Configure Authentication

1. Go to **Auth** in Appwrite console
2. **Enable Email/Password** authentication
3. **Optional**: Enable OAuth providers (Google, GitHub, etc.)
4. **Security Settings**:
   - Set password requirements: minimum 8 characters
   - Enable email verification (recommended for production)
   - Set session length: 30 days
   - Enable 2FA (optional but recommended)

## 4. Set Security Permissions

For each collection, configure these permissions:

### Document-level permissions:
```javascript
// Read permission: Only the user who created the document
Permission.read(Role.user("[USER_ID]"))

// Write permission: Only the user who created the document  
Permission.write(Role.user("[USER_ID]"))

// Create permission: Any authenticated user
Permission.create(Role.users())
```

### Collection-level permissions:
- **Read**: `users` (authenticated users only)
- **Create**: `users` (authenticated users only) 
- **Update**: `users` (document owner only via document permissions)
- **Delete**: `users` (document owner only via document permissions)

## 5. Update Environment Variables

Update your `.env` file with all the collection IDs:

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
VITE_APPWRITE_DATABASE_ID=your_database_id_here

# Collection IDs
VITE_APPWRITE_TASKS_COLLECTION_ID=tasks
VITE_APPWRITE_POMODORO_COLLECTION_ID=pomodoro_sessions
VITE_APPWRITE_NOTES_COLLECTION_ID=notes
VITE_APPWRITE_FOLDERS_COLLECTION_ID=folders
VITE_APPWRITE_SETTINGS_COLLECTION_ID=user_settings
```

## 6. Security Best Practices Implemented

✅ **Row-Level Security**: Each document is protected by user-specific permissions
✅ **Input Validation**: Appwrite validates all data types and constraints
✅ **Rate Limiting**: Built-in request rate limiting
✅ **CORS Protection**: Configurable CORS policies
✅ **SQL Injection Prevention**: NoSQL document-based, immune to SQL injection
✅ **XSS Protection**: Automatic data sanitization
✅ **Authentication**: Secure JWT-based authentication
✅ **Encryption**: Data encrypted in transit (HTTPS) and at rest
✅ **Audit Logs**: Built-in activity logging and monitoring

## 7. Performance Optimizations

✅ **Indexes**: Optimized queries with compound indexes
✅ **Pagination**: Built-in query pagination
✅ **Caching**: Automatic CDN and database caching
✅ **Real-time**: WebSocket subscriptions for live updates
✅ **Compression**: Automatic response compression
✅ **Global CDN**: Worldwide content delivery

## 8. Monitoring & Analytics

With GitHub Education Pack, you get:
- **Usage Analytics**: API calls, storage, bandwidth
- **Performance Metrics**: Response times, error rates
- **Security Logs**: Authentication attempts, permission failures
- **Real-time Dashboard**: Live application monitoring

## 9. Deployment Configuration

### Environment-specific Configuration:
```javascript
// Production
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1

// Development (if using local Appwrite)
VITE_APPWRITE_ENDPOINT=http://localhost/v1
```

## 10. Next Steps

1. ✅ Create Appwrite project and database
2. ✅ Set up collections with the provided schema
3. ✅ Configure authentication settings
4. ✅ Update environment variables
5. 🔄 Test the Appwrite integration
6. 🔄 Migrate existing contexts to use Appwrite
7. 🔄 Deploy to production

## Cost & Scaling

**With GitHub Education Pack:**
- **Free tier**: 75k requests/month, 2GB storage, 2GB bandwidth
- **Pro credits**: $50/month additional resources
- **Auto-scaling**: Handles traffic spikes automatically
- **99.9% uptime SLA**

This setup gives you a production-ready backend that can handle thousands of users with excellent performance and security! 🚀