#!/usr/bin/env node

/**
 * FocusFlow Appwrite Health Check Script
 * 
 * This script verifies that your Appwrite setup is working correctly
 * by testing connections and validating the database schema.
 */

import { Client, Databases, Account } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client();
const databases = new Databases(client);
const account = new Account(client);

// Configuration from environment variables
const config = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT,
  projectId: process.env.VITE_APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID,
  collections: {
    tasks: process.env.VITE_APPWRITE_TASKS_COLLECTION_ID,
    pomodoroSessions: process.env.VITE_APPWRITE_POMODORO_COLLECTION_ID,
    notes: process.env.VITE_APPWRITE_NOTES_COLLECTION_ID,
    folders: process.env.VITE_APPWRITE_FOLDERS_COLLECTION_ID,
    userSettings: process.env.VITE_APPWRITE_SETTINGS_COLLECTION_ID,
  }
};

// Initialize client
client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const checkHealth = async () => {
  console.log('🔍 FocusFlow Appwrite Health Check\n');
  
  let allGood = true;

  // 1. Check environment variables
  console.log('📋 Checking Environment Variables...');
  const requiredVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID', 
    'VITE_APPWRITE_DATABASE_ID',
    'APPWRITE_API_KEY'
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`  ✅ ${varName}: ${varName === 'APPWRITE_API_KEY' ? '[HIDDEN]' : process.env[varName]}`);
    } else {
      console.log(`  ❌ ${varName}: Missing`);
      allGood = false;
    }
  }

  // 2. Test Appwrite connection
  console.log('\n🌐 Testing Appwrite Connection...');
  try {
    const health = await client.call('GET', '/health');
    console.log('  ✅ Connection successful');
  } catch (error) {
    console.log('  ❌ Connection failed:', error.message);
    allGood = false;
  }

  // 3. Check database exists
  console.log('\n🗄️  Checking Database...');
  try {
    const database = await databases.get(config.databaseId);
    console.log(`  ✅ Database "${database.name}" exists`);
  } catch (error) {
    console.log('  ❌ Database check failed:', error.message);
    allGood = false;
  }

  // 4. Check collections
  console.log('\n📁 Checking Collections...');
  const expectedCollections = [
    { id: 'tasks', name: 'Tasks' },
    { id: 'pomodoro_sessions', name: 'Pomodoro Sessions' },
    { id: 'notes', name: 'Notes' },
    { id: 'folders', name: 'Folders' },
    { id: 'user_settings', name: 'User Settings' }
  ];

  for (const collection of expectedCollections) {
    try {
      const coll = await databases.getCollection(config.databaseId, collection.id);
      console.log(`  ✅ Collection "${coll.name}" exists (${coll.attributes.length} attributes)`);
    } catch (error) {
      console.log(`  ❌ Collection "${collection.name}" missing or inaccessible`);
      allGood = false;
    }
  }

  // 5. Check specific attributes
  console.log('\n🏷️  Checking Critical Attributes...');
  const criticalAttributes = [
    { collection: 'tasks', attributes: ['title', 'priority', 'completed', 'focusSeconds', 'userId'] },
    { collection: 'pomodoro_sessions', attributes: ['mode', 'durationSec', 'startedAt', 'userId'] },
    { collection: 'notes', attributes: ['title', 'body', 'userId'] },
    { collection: 'user_settings', attributes: ['theme', 'focusDuration', 'userId'] }
  ];

  for (const { collection, attributes } of criticalAttributes) {
    try {
      const coll = await databases.getCollection(config.databaseId, collection);
      const existingAttrs = coll.attributes.map(attr => attr.key);
      
      for (const attr of attributes) {
        if (existingAttrs.includes(attr)) {
          console.log(`  ✅ ${collection}.${attr}`);
        } else {
          console.log(`  ❌ ${collection}.${attr} missing`);
          allGood = false;
        }
      }
    } catch (error) {
      console.log(`  ❌ Could not check ${collection} attributes`);
      allGood = false;
    }
  }

  // 6. Test client SDK connection (without API key)
  console.log('\n📱 Testing Client SDK Connection...');
  try {
    const clientSDK = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
    
    // Test if we can at least reach the endpoint
    await clientSDK.call('GET', '/');
    console.log('  ✅ Client SDK can connect to endpoint');
  } catch (error) {
    if (error.code === 401) {
      console.log('  ✅ Client SDK connection OK (auth required as expected)');
    } else {
      console.log('  ❌ Client SDK connection failed:', error.message);
      allGood = false;
    }
  }

  // 7. Check authentication setup
  console.log('\n🔐 Checking Authentication Setup...');
  try {
    // Try to list users (will fail if auth not configured, but tells us about auth setup)
    await databases.listDocuments(config.databaseId, 'tasks', []);
    console.log('  ✅ Database queries are working');
  } catch (error) {
    if (error.code === 401) {
      console.log('  ⚠️  Authentication required - this is normal for production');
    } else {
      console.log('  ❌ Unexpected error:', error.message);
    }
  }

  // Final result
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('🎉 ALL CHECKS PASSED! Your Appwrite setup is perfect!');
    console.log('\n📋 Setup Status:');
    console.log('✅ Environment variables configured');
    console.log('✅ Appwrite connection working');
    console.log('✅ Database and collections created');
    console.log('✅ All required attributes present');
    console.log('✅ Client SDK can connect');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Enable authentication in Appwrite Console');
    console.log('2. Start migrating your React contexts');
    console.log('3. Test with real user registration/login');
    
    console.log('\n🌐 Appwrite Console: https://cloud.appwrite.io/console');
  } else {
    console.log('❌ SOME CHECKS FAILED - Please review the errors above');
    console.log('\n🔧 Common fixes:');
    console.log('- Make sure all environment variables are set in .env');
    console.log('- Check that your Appwrite API key has correct permissions');
    console.log('- Verify your project ID and database ID are correct');
    console.log('- Re-run setup scripts if collections are missing');
  }
};

// Run health check
checkHealth().catch(console.error);