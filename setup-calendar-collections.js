import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupCalendarCollections() {
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
  
  try {
    console.log('🚀 Setting up calendar collections...');

    // 1. Calendar Events Collection
    console.log('📅 Creating Calendar Events collection...');
    const calendarEventsCollection = await databases.createCollection(
      databaseId,
      'calendar_events',
      'Calendar Events',
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );

    // Add attributes for Calendar Events
    const calendarEventAttributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'type', type: 'enum', elements: ['focus', 'break', 'task', 'meeting', 'personal', 'goal'], required: true },
      { key: 'status', type: 'enum', elements: ['scheduled', 'in-progress', 'completed', 'cancelled', 'missed'], required: true },
      { key: 'startTime', type: 'datetime', required: true },
      { key: 'endTime', type: 'datetime', required: true },
      { key: 'allDay', type: 'boolean', required: true, default: false },
      { key: 'recurrence', type: 'enum', elements: ['none', 'daily', 'weekly', 'monthly', 'custom'], required: true, default: 'none' },
      { key: 'recurrenceEndDate', type: 'datetime', required: false },
      { key: 'recurrenceInterval', type: 'integer', required: true, default: 1 },
      { key: 'recurrenceDaysOfWeek', type: 'string', size: 50, required: false },
      { key: 'recurrenceDayOfMonth', type: 'integer', required: false },
      { key: 'taskId', type: 'string', size: 255, required: false },
      { key: 'pomodoroSessionId', type: 'string', size: 255, required: false },
      { key: 'parentEventId', type: 'string', size: 255, required: false },
      { key: 'focusDuration', type: 'integer', required: false },
      { key: 'actualFocusTime', type: 'integer', required: false },
      { key: 'productivityRating', type: 'enum', elements: ['great', 'some-distractions', 'unfocused'], required: false },
      { key: 'goalMinutes', type: 'integer', required: false },
      { key: 'color', type: 'string', size: 20, required: false },
      { key: 'location', type: 'string', size: 500, required: false },
      { key: 'attendees', type: 'string', size: 2000, required: false },
      { key: 'reminders', type: 'string', size: 200, required: false },
      { key: 'tags', type: 'string', size: 2000, required: false }
    ];

    for (const attr of calendarEventAttributes) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(databaseId, calendarEventsCollection.$id, attr.key, attr.size, attr.required, attr.default);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(databaseId, calendarEventsCollection.$id, attr.key, attr.required, undefined, undefined, attr.default);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(databaseId, calendarEventsCollection.$id, attr.key, attr.required, attr.default);
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(databaseId, calendarEventsCollection.$id, attr.key, attr.required, attr.default);
        } else if (attr.type === 'enum') {
          await databases.createEnumAttribute(databaseId, calendarEventsCollection.$id, attr.key, attr.elements, attr.required, attr.default);
        }
        console.log(`  ✅ Added ${attr.key} attribute`);
      } catch (error) {
        console.log(`  ⚠️  Error adding ${attr.key} attribute:`, error.message);
      }
    }

    // 2. Time Blocks Collection
    console.log('⏱️  Creating Time Blocks collection...');
    const timeBlocksCollection = await databases.createCollection(
      databaseId,
      'time_blocks',
      'Time Blocks',
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );

    const timeBlockAttributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'startTime', type: 'datetime', required: true },
      { key: 'endTime', type: 'datetime', required: true },
      { key: 'type', type: 'enum', elements: ['focus', 'break', 'buffer'], required: true },
      { key: 'taskIds', type: 'string', size: 2000, required: false },
      { key: 'color', type: 'string', size: 20, required: false },
      { key: 'flexible', type: 'boolean', required: true, default: true }
    ];

    for (const attr of timeBlockAttributes) {
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(databaseId, timeBlocksCollection.$id, attr.key, attr.size, attr.required, attr.default);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(databaseId, timeBlocksCollection.$id, attr.key, attr.required, attr.default);
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(databaseId, timeBlocksCollection.$id, attr.key, attr.required, attr.default);
        } else if (attr.type === 'enum') {
          await databases.createEnumAttribute(databaseId, timeBlocksCollection.$id, attr.key, attr.elements, attr.required, attr.default);
        }
        console.log(`  ✅ Added ${attr.key} attribute`);
      } catch (error) {
        console.log(`  ⚠️  Error adding ${attr.key} attribute:`, error.message);
      }
    }

    // 3. Productivity Goals Collection
    console.log('🎯 Creating Productivity Goals collection...');
    const productivityGoalsCollection = await databases.createCollection(
      databaseId,
      'productivity_goals',
      'Productivity Goals',
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );

    const goalAttributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'type', type: 'enum', elements: ['daily', 'weekly', 'monthly'], required: true },
      { key: 'targetMinutes', type: 'integer', required: true },
      { key: 'currentMinutes', type: 'integer', required: true, default: 0 },
      { key: 'date', type: 'string', size: 50, required: true },
      { key: 'achieved', type: 'boolean', required: true, default: false }
    ];

    for (const attr of goalAttributes) {
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(databaseId, productivityGoalsCollection.$id, attr.key, attr.size, attr.required, attr.default);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(databaseId, productivityGoalsCollection.$id, attr.key, attr.required, undefined, undefined, attr.default);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(databaseId, productivityGoalsCollection.$id, attr.key, attr.required, attr.default);
        } else if (attr.type === 'enum') {
          await databases.createEnumAttribute(databaseId, productivityGoalsCollection.$id, attr.key, attr.elements, attr.required, attr.default);
        }
        console.log(`  ✅ Added ${attr.key} attribute`);
      } catch (error) {
        console.log(`  ⚠️  Error adding ${attr.key} attribute:`, error.message);
      }
    }

    // Create indexes for performance
    console.log('📊 Creating indexes...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Calendar Events indexes
      await databases.createIndex(databaseId, calendarEventsCollection.$id, 'user_starttime', 'key', ['userId', 'startTime']);
      await databases.createIndex(databaseId, calendarEventsCollection.$id, 'user_type', 'key', ['userId', 'type']);
      console.log('  ✅ Calendar events indexes created');
    } catch (error) {
      console.log('  ⚠️  Calendar events index error:', error.message);
    }

    try {
      // Time Blocks indexes  
      await databases.createIndex(databaseId, timeBlocksCollection.$id, 'user_starttime', 'key', ['userId', 'startTime']);
      console.log('  ✅ Time blocks indexes created');
    } catch (error) {
      console.log('  ⚠️  Time blocks index error:', error.message);
    }

    try {
      // Productivity Goals indexes
      await databases.createIndex(databaseId, productivityGoalsCollection.$id, 'user_type_date', 'key', ['userId', 'type', 'date']);
      console.log('  ✅ Productivity goals indexes created');
    } catch (error) {
      console.log('  ⚠️  Productivity goals index error:', error.message);
    }

    console.log('\n🎉 Calendar collections setup completed!');
    console.log('\n📝 Add these to your .env file:');
    console.log(`VITE_APPWRITE_CALENDAR_EVENTS_COLLECTION_ID=${calendarEventsCollection.$id}`);
    console.log(`VITE_APPWRITE_TIME_BLOCKS_COLLECTION_ID=${timeBlocksCollection.$id}`);
    console.log(`VITE_APPWRITE_PRODUCTIVITY_GOALS_COLLECTION_ID=${productivityGoalsCollection.$id}`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupCalendarCollections();