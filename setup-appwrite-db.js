#!/usr/bin/env node

/**
 * FocusFlow Appwrite Database Setup Scri      { key: 'priority', type: 'enum', elements: ['low', 'medium', 'high'], required: true },
      { key: 'tags', type: 'string', size: 1000, required: false },
      { key: 'dueDate', type: 'datetime', required: false },
      { key: 'completed', type: 'boolean', required: true },
      { key: 'focusSeconds', type: 'integer', required: true }, 
 * This script automatically creates all database collections, attributes, and indexes
 *      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'type', type: 'enum', elements: ['focus-session', 'break', 'task', 'meeting', 'reminder', 'custom'], required: true },
      { key: 'status', type: 'enum', elements: ['scheduled', 'in-progress', 'completed', 'cancelled', 'missed'], required: true },
      { key: 'startTime', type: 'datetime', required: true },
      { key: 'endTime', type: 'datetime', required: true },
      { key: 'allDay', type: 'boolean', required: true },
      { key: 'recurrence', type: 'enum', elements: ['none', 'daily', 'weekly', 'monthly', 'custom'], required: true },
      { key: 'recurrenceEndDate', type: 'datetime', required: false },
      { key: 'recurrenceInterval', type: 'integer', required: false, default: 1 },ocusFlow application using the Appwrite Server SDK.
 * 
 * Usage:
 * 1. Install dependencies: npm install node-appwrite
 * 2. Set environment variables in .env
 * 3. Run: node setup-appwrite-db.js
 */

import { Client, Databases, Users } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client();
const databases = new Databases(client);
const users = new Users(client);

// Configuration from environment variables
const config = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.VITE_APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY, // Server API key (different from client)
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID || 'focusflow-main',
};

// Validate configuration
if (!config.projectId || !config.apiKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_APPWRITE_PROJECT_ID');
  console.error('   APPWRITE_API_KEY (Server API key from Appwrite console)');
  process.exit(1);
}

// Initialize client
client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

// Database schema definitions
const collections = {
  tasks: {
    collectionId: 'tasks',
    name: 'Tasks',
    permissions: ['read("users")', 'write("users")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    enabled: true,
    attributes: [
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'priority', type: 'enum', elements: ['low', 'medium', 'high'], required: true, default: 'medium' },
      { key: 'tags', type: 'string', size: 50, array: true, required: false },
      { key: 'dueDate', type: 'datetime', required: false },
      { key: 'completed', type: 'boolean', required: true, default: false },
      { key: 'focusSeconds', type: 'integer', required: true, default: 0 },
      { key: 'userId', type: 'string', size: 36, required: true }
    ],
    indexes: [
      { key: 'user_tasks', type: 'key', attributes: ['userId'] },
      { key: 'user_completed', type: 'key', attributes: ['userId', 'completed'] },
      { key: 'user_priority', type: 'key', attributes: ['userId', 'priority'] },
      { key: 'user_due_date', type: 'key', attributes: ['userId', 'dueDate'] }
    ]
  },

  pomodoro_sessions: {
    collectionId: 'pomodoro_sessions',
    name: 'Pomodoro Sessions',
    permissions: ['read("users")', 'write("users")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    enabled: true,
    attributes: [
      { key: 'mode', type: 'enum', elements: ['focus', 'shortBreak', 'longBreak'], required: true },
      { key: 'durationSec', type: 'integer', required: true },
      { key: 'startedAt', type: 'datetime', required: true },
      { key: 'endedAt', type: 'datetime', required: false },
      { key: 'aborted', type: 'boolean', required: false, default: false },
      { key: 'taskId', type: 'string', size: 36, required: false },
      { key: 'userId', type: 'string', size: 36, required: true }
    ],
    indexes: [
      { key: 'user_sessions', type: 'key', attributes: ['userId'] },
      { key: 'user_task_sessions', type: 'key', attributes: ['userId', 'taskId'] },
      { key: 'user_mode_sessions', type: 'key', attributes: ['userId', 'mode'] },
      { key: 'user_date_sessions', type: 'key', attributes: ['userId', 'startedAt'] }
    ]
  },

  notes: {
    collectionId: 'notes',
    name: 'Notes',
    permissions: ['read("users")', 'write("users")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    enabled: true,
    attributes: [
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'body', type: 'string', size: 100000, required: false },
      { key: 'folderId', type: 'string', size: 36, required: false },
      { key: 'taskId', type: 'string', size: 36, required: false },
      { key: 'userId', type: 'string', size: 36, required: true }
    ],
    indexes: [
      { key: 'user_notes', type: 'key', attributes: ['userId'] },
      { key: 'user_folder_notes', type: 'key', attributes: ['userId', 'folderId'] },
      { key: 'user_task_notes', type: 'key', attributes: ['userId', 'taskId'] }
    ]
  },

  folders: {
    collectionId: 'folders',
    name: 'Folders',
    permissions: ['read("users")', 'write("users")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    enabled: true,
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'parentId', type: 'string', size: 36, required: false },
      { key: 'userId', type: 'string', size: 36, required: true }
    ],
    indexes: [
      { key: 'user_folders', type: 'key', attributes: ['userId'] },
      { key: 'user_parent_folders', type: 'key', attributes: ['userId', 'parentId'] }
    ]
  },

  user_settings: {
    collectionId: 'user_settings',
    name: 'User Settings',
    permissions: ['read("users")', 'write("users")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    enabled: true,
    attributes: [
      { key: 'theme', type: 'enum', elements: ['light', 'dark', 'system'], required: true },
      { key: 'focusDuration', type: 'integer', required: true },
      { key: 'shortBreakDuration', type: 'integer', required: true },
      { key: 'longBreakDuration', type: 'integer', required: true },
      { key: 'autoStartNext', type: 'boolean', required: true },
      { key: 'goalMinutes', type: 'integer', required: true },
      { key: 'longBreakEvery', type: 'integer', required: true },
      { key: 'enableSound', type: 'boolean', required: true },
      { key: 'enableNotifications', type: 'boolean', required: true },
      { key: 'userId', type: 'string', size: 36, required: true }
    ],
    indexes: [
      { key: 'user_settings_unique', type: 'unique', attributes: ['userId'] }
    ]
  },

  calendar_events: {
    collectionId: 'calendar_events',
    name: 'Calendar Events',
    permissions: ['read("users")', 'write("users")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    enabled: true,
    attributes: [
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'type', type: 'enum', elements: ['focus', 'break', 'task', 'meeting', 'personal', 'goal'], required: true },
      { key: 'status', type: 'enum', elements: ['scheduled', 'in-progress', 'completed', 'cancelled', 'missed'], required: true, default: 'scheduled' },
      { key: 'startTime', type: 'datetime', required: true },
      { key: 'endTime', type: 'datetime', required: true },
      { key: 'allDay', type: 'boolean', required: true, default: false },
      { key: 'recurrence', type: 'enum', elements: ['none', 'daily', 'weekly', 'monthly', 'custom'], required: true, default: 'none' },
      { key: 'recurrenceEndDate', type: 'datetime', required: false },
      { key: 'recurrenceInterval', type: 'integer', required: false, default: 1 },
      { key: 'recurrenceDaysOfWeek', type: 'string', size: 100, required: false },
      { key: 'recurrenceDayOfMonth', type: 'integer', required: false },
      { key: 'taskId', type: 'string', size: 36, required: false },
      { key: 'pomodoroSessionId', type: 'string', size: 36, required: false },
      { key: 'parentEventId', type: 'string', size: 36, required: false },
      { key: 'focusDuration', type: 'integer', required: false },
      { key: 'actualFocusTime', type: 'integer', required: false },
      { key: 'productivityRating', type: 'enum', elements: ['great', 'some-distractions', 'unfocused'], required: false },
      { key: 'goalMinutes', type: 'integer', required: false },
      { key: 'color', type: 'string', size: 20, required: false },
      { key: 'location', type: 'string', size: 500, required: false },
      { key: 'attendees', type: 'string', size: 2000, required: false },
      { key: 'reminders', type: 'string', size: 200, required: false },
      { key: 'tags', type: 'string', size: 1000, required: false },
      { key: 'userId', type: 'string', size: 36, required: true }
    ],
    indexes: [
      { key: 'user_events', type: 'key', attributes: ['userId'] },
      { key: 'user_type_events', type: 'key', attributes: ['userId', 'type'] },
      { key: 'user_status_events', type: 'key', attributes: ['userId', 'status'] },
      { key: 'user_start_time_events', type: 'key', attributes: ['userId', 'startTime'] },
      { key: 'user_task_events', type: 'key', attributes: ['userId', 'taskId'] }
    ]
  }
};

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createDatabase = async () => {
  try {
    console.log(`🗄️  Creating database: ${config.databaseId}`);
    await databases.create(config.databaseId, 'FocusFlow Database');
    console.log('✅ Database created successfully');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  Database already exists, continuing...');
    } else {
      throw error;
    }
  }
};

const createCollection = async (collectionData) => {
  try {
    console.log(`📁 Creating collection: ${collectionData.name}`);
    
    const collection = await databases.createCollection(
      config.databaseId,
      collectionData.collectionId,
      collectionData.name,
      collectionData.permissions,
      collectionData.documentSecurity,
      collectionData.enabled
    );

    console.log(`✅ Collection "${collectionData.name}" created`);
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Collection "${collectionData.name}" already exists`);
      return null;
    } else {
      throw error;
    }
  }
};

const createAttribute = async (collectionId, attribute) => {
  try {
    let result;
    
    switch (attribute.type) {
      case 'string':
        if (attribute.array) {
          result = await databases.createStringAttribute(
            config.databaseId,
            collectionId,
            attribute.key,
            attribute.size,
            attribute.required,
            attribute.default,
            attribute.array
          );
        } else {
          result = await databases.createStringAttribute(
            config.databaseId,
            collectionId,
            attribute.key,
            attribute.size,
            attribute.required,
            attribute.default
          );
        }
        break;
      
      case 'integer':
        result = await databases.createIntegerAttribute(
          config.databaseId,
          collectionId,
          attribute.key,
          attribute.required,
          attribute.min,
          attribute.max,
          attribute.default
        );
        break;
      
      case 'boolean':
        result = await databases.createBooleanAttribute(
          config.databaseId,
          collectionId,
          attribute.key,
          attribute.required,
          attribute.default
        );
        break;
      
      case 'datetime':
        result = await databases.createDatetimeAttribute(
          config.databaseId,
          collectionId,
          attribute.key,
          attribute.required,
          attribute.default
        );
        break;
      
      case 'enum':
        result = await databases.createEnumAttribute(
          config.databaseId,
          collectionId,
          attribute.key,
          attribute.elements,
          attribute.required,
          attribute.default
        );
        break;
    }

    console.log(`  ✓ Attribute "${attribute.key}" (${attribute.type})`);
    return result;
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ℹ️  Attribute "${attribute.key}" already exists`);
    } else {
      console.error(`  ❌ Failed to create attribute "${attribute.key}":`, error.message);
    }
  }
};

const createIndex = async (collectionId, index) => {
  try {
    const result = await databases.createIndex(
      config.databaseId,
      collectionId,
      index.key,
      index.type,
      index.attributes
    );
    console.log(`  ✓ Index "${index.key}"`);
    return result;
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ℹ️  Index "${index.key}" already exists`);
    } else {
      console.error(`  ❌ Failed to create index "${index.key}":`, error.message);
    }
  }
};

// Main setup function
const setupAppwriteDatabase = async () => {
  try {
    console.log('🚀 Starting FocusFlow Appwrite Database Setup');
    console.log(`📡 Endpoint: ${config.endpoint}`);
    console.log(`🆔 Project: ${config.projectId}`);
    console.log(`🗄️  Database: ${config.databaseId}\n`);

    // Create database
    await createDatabase();
    await sleep(2000);

    // Create collections
    for (const [collectionKey, collectionData] of Object.entries(collections)) {
      console.log(`\n📁 Setting up collection: ${collectionData.name}`);
      
      // Create collection
      await createCollection(collectionData);
      await sleep(2000);

      // Create attributes
      console.log('📝 Creating attributes...');
      for (const attribute of collectionData.attributes) {
        await createAttribute(collectionData.collectionId, attribute);
        await sleep(1000); // Wait for attribute to be ready
      }

      // Wait for all attributes to be available
      console.log('⏳ Waiting for attributes to be ready...');
      await sleep(5000);

      // Create indexes
      if (collectionData.indexes && collectionData.indexes.length > 0) {
        console.log('🔍 Creating indexes...');
        for (const index of collectionData.indexes) {
          await createIndex(collectionData.collectionId, index);
          await sleep(1000);
        }
      }
    }

    // Update .env file with collection IDs
    console.log('\n📝 Updating .env file...');
    const envContent = `# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=${config.endpoint}
VITE_APPWRITE_PROJECT_ID=${config.projectId}
VITE_APPWRITE_DATABASE_ID=${config.databaseId}

# Collection IDs
VITE_APPWRITE_TASKS_COLLECTION_ID=tasks
VITE_APPWRITE_POMODORO_COLLECTION_ID=pomodoro_sessions
VITE_APPWRITE_NOTES_COLLECTION_ID=notes
VITE_APPWRITE_FOLDERS_COLLECTION_ID=folders
VITE_APPWRITE_SETTINGS_COLLECTION_ID=user_settings
VITE_APPWRITE_CALENDAR_EVENTS_COLLECTION_ID=calendar_events

# Server API Key (keep this secret, only for server-side operations)
APPWRITE_API_KEY=${config.apiKey}
`;

    await import('fs').then(fs => fs.promises.writeFile('.env', envContent));
    console.log('✅ .env file updated');

    console.log('\n🎉 FocusFlow Appwrite Database Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Database and collections created');
    console.log('2. ✅ Attributes and indexes configured');
    console.log('3. ✅ Environment file updated');
    console.log('4. 🔄 Test the setup by running your React app');
    console.log('5. 🔄 Configure authentication in Appwrite console');
    console.log('\n🌐 Appwrite Console: https://cloud.appwrite.io/console');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

// Run setup
setupAppwriteDatabase();