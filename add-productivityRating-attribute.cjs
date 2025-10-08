const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const collectionId = process.env.VITE_APPWRITE_POMODORO_COLLECTION_ID;

async function addProductivityRating() {
  try {
    console.log('🔧 Adding productivityRating attribute to pomodoro_sessions collection...');
    
    await databases.createEnumAttribute(
      databaseId,
      collectionId,
      'productivityRating',
      ['great', 'some-distractions', 'unfocused'],
      false // not required
    );
    
    console.log('✅ Successfully added productivityRating attribute!');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  productivityRating attribute already exists');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

addProductivityRating()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
