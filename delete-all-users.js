import { Client, Users } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

async function deleteAllUsers() {
  try {
    console.log('🗑️  Fetching all users...\n');
    
    // Get all users
    const allUsers = await users.list();
    
    if (allUsers.total === 0) {
      console.log('✅ No users found. Database is already clean!');
      return;
    }
    
    console.log(`Found ${allUsers.total} users:\n`);
    
    // List all users first
    allUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email || user.phone || user.$id})`);
    });
    
    console.log('\n⚠️  WARNING: This will DELETE ALL USERS!\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds before deleting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🗑️  Deleting users...\n');
    
    // Delete each user
    for (const user of allUsers.users) {
      try {
        await users.delete(user.$id);
        console.log(`✅ Deleted: ${user.name || user.email || user.$id}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${user.$id}:`, error.message);
      }
    }
    
    console.log('\n✅ All users deleted successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteAllUsers();
