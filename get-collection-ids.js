import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function getCollectionIds() {
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
  
  try {
    console.log('📊 Fetching all collections...\n');
    
    const collections = await databases.listCollections(databaseId);
    
    console.log('Found', collections.total, 'collections:\n');
    
    collections.collections.forEach(collection => {
      console.log(`📁 ${collection.name}`);
      console.log(`   ID: ${collection.$id}`);
      console.log(`   Attributes: ${collection.attributes.length}`);
      console.log('');
    });
    
    console.log('📝 Add these to your .env file:\n');
    
    collections.collections.forEach(collection => {
      const name = collection.name.replace(/\s+/g, '_').toUpperCase();
      console.log(`VITE_APPWRITE_${name}_COLLECTION_ID=${collection.$id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getCollectionIds();
