/**
 * Add Google Calendar sync attributes to the calendar_events collection
 * Run this after setting up your Appwrite database to add the new sync fields
 * 
 * Usage: node add-calendar-sync-attributes.cjs
 */

const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function addSyncAttributes() {
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.VITE_APPWRITE_CALENDAR_EVENTS_COLLECTION_ID;

  if (!databaseId || !collectionId) {
    console.error('❌ Missing required environment variables:');
    console.error('   VITE_APPWRITE_DATABASE_ID:', databaseId || '(not set)');
    console.error('   VITE_APPWRITE_CALENDAR_EVENTS_COLLECTION_ID:', collectionId || '(not set)');
    process.exit(1);
  }

  console.log('🔧 Adding Google Calendar sync attributes...');
  console.log(`   Database: ${databaseId}`);
  console.log(`   Collection: ${collectionId}`);

  try {
    // Add googleCalendarId attribute (optional string)
    try {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        'googleCalendarId',
        500,
        false // not required
      );
      console.log('✅ Added googleCalendarId attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('⏭️  googleCalendarId attribute already exists');
      } else {
        throw error;
      }
    }

    // Add googleCalendarEtag attribute (optional string)
    try {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        'googleCalendarEtag',
        500,
        false // not required
      );
      console.log('✅ Added googleCalendarEtag attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('⏭️  googleCalendarEtag attribute already exists');
      } else {
        throw error;
      }
    }

    // Add source attribute (optional enum with local as default)
    try {
      await databases.createEnumAttribute(
        databaseId,
        collectionId,
        'source',
        ['local', 'google', 'synced'],
        false, // not required (optional)
        'local' // default value works for optional attributes
      );
      console.log('✅ Added source attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('⏭️  source attribute already exists');
      } else {
        throw error;
      }
    }

    // Add lastSyncedAt attribute (optional datetime)
    try {
      await databases.createDatetimeAttribute(
        databaseId,
        collectionId,
        'lastSyncedAt',
        false // not required
      );
      console.log('✅ Added lastSyncedAt attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('⏭️  lastSyncedAt attribute already exists');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Successfully added all Google Calendar sync attributes!');
    console.log('\n📝 Next steps:');
    console.log('   1. Your calendar events can now sync with Google Calendar');
    console.log('   2. Events from Google will be marked with source="google"');
    console.log('   3. Events created in Focus Flow will be marked with source="local"');
    console.log('   4. Auto-sync will run periodically if enabled in settings');

  } catch (error) {
    console.error('\n❌ Error adding attributes:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

addSyncAttributes();
