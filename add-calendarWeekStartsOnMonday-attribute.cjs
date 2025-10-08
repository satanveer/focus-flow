const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68d833cd002390a93c4c')
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

const databaseId = '68d834c00022954c22ff';
const collectionId = 'user_settings';

async function addAttribute() {
  try {
    console.log('Adding calendarWeekStartsOnMonday attribute to user_settings collection...');
    
    await databases.createBooleanAttribute(
      databaseId,
      collectionId,
      'calendarWeekStartsOnMonday',
      false, // not required
      true // default value: true (week starts on Monday)
    );
    
    console.log('✅ calendarWeekStartsOnMonday attribute added successfully!');
    console.log('Default value: true (week starts on Monday)');
  } catch (error) {
    console.error('❌ Error adding attribute:', error.message);
  }
}

addAttribute();
