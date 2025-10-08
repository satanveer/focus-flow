import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function addShowTimerInTabAttribute() {
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.VITE_APPWRITE_SETTINGS_COLLECTION_ID;
  
  try {
    console.log('📝 Adding showTimerInTab attribute to user_settings collection...');
    
    await databases.createBooleanAttribute(
      databaseId,
      collectionId,
      'showTimerInTab',
      false, // not required
      true   // default value = true
    );
    
    console.log('✅ Successfully added showTimerInTab attribute!');
    console.log('⏳ Wait 30-60 seconds for the attribute to be available...');
    
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Attribute already exists!');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

addShowTimerInTabAttribute();
