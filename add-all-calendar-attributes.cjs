const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68d833cd002390a93c4c')
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

const databaseId = '68d834c00022954c22ff';
const collectionId = 'user_settings';

async function addAllMissingAttributes() {
  const attributes = [
    {
      name: 'calendarShowWeekends',
      type: 'boolean',
      default: true,
      description: 'Show weekends in calendar view'
    },
    {
      name: 'calendarDefaultFocusDuration',
      type: 'integer',
      default: 1500,
      description: 'Default focus duration for calendar events (seconds)'
    },
    {
      name: 'calendarAutoScheduleTasks',
      type: 'boolean',
      default: false,
      description: 'Automatically schedule tasks on calendar'
    },
    {
      name: 'calendarReminderMinutes',
      type: 'string',
      default: '[15,5]',
      description: 'Default reminder times (JSON array)'
    },
    {
      name: 'calendarTimeZone',
      type: 'string',
      default: 'UTC',
      description: 'User timezone for calendar events'
    }
  ];

  console.log('Adding missing calendar attributes to user_settings collection...\n');

  for (const attr of attributes) {
    try {
      console.log(`Adding ${attr.name}...`);
      
      if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          databaseId,
          collectionId,
          attr.name,
          false, // not required
          attr.default
        );
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(
          databaseId,
          collectionId,
          attr.name,
          false, // not required
          0, // min
          999999, // max
          attr.default
        );
      } else if (attr.type === 'string') {
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          attr.name,
          10000, // max length
          false, // not required
          attr.default
        );
      }
      
      console.log(`✅ ${attr.name} added (${attr.description})`);
      // Wait a bit between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      if (error.message?.includes('already exists')) {
        console.log(`ℹ️  ${attr.name} already exists, skipping`);
      } else {
        console.error(`❌ Error adding ${attr.name}:`, error.message);
      }
    }
  }

  console.log('\n✅ All missing attributes processed!');
}

addAllMissingAttributes();
