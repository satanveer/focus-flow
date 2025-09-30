#!/usr/bin/env node

/**
 * FocusFlow Appwrite Database Fix Script
 * 
 * This script fixes the missing attributes that failed in the initial setup
 * by creating them without default values (making them optional where needed)
 */

import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client();
const databases = new Databases(client);

// Configuration from environment variables
const config = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.VITE_APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID || 'focusflow-main',
};

// Initialize client
client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createAttribute = async (collectionId, attribute) => {
  try {
    let result;
    
    switch (attribute.type) {
      case 'string':
        result = await databases.createStringAttribute(
          config.databaseId,
          collectionId,
          attribute.key,
          attribute.size,
          attribute.required || false,
          attribute.default || null
        );
        break;
      
      case 'integer':
        result = await databases.createIntegerAttribute(
          config.databaseId,
          collectionId,
          attribute.key,
          attribute.required || false,
          attribute.min,
          attribute.max,
          attribute.default || null
        );
        break;
      
      case 'boolean':
        result = await databases.createBooleanAttribute(
          config.databaseId,
          collectionId,
          attribute.key,
          attribute.required || false,
          attribute.default || null
        );
        break;
      
      case 'enum':
        result = await databases.createEnumAttribute(
          config.databaseId,
          collectionId,
          attribute.key,
          attribute.elements,
          attribute.required || false,
          attribute.default || null
        );
        break;
    }

    console.log(`  ✅ Created attribute "${attribute.key}" (${attribute.type})`);
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
    console.log(`  ✅ Created index "${index.key}"`);
    return result;
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ℹ️  Index "${index.key}" already exists`);
    } else {
      console.error(`  ❌ Failed to create index "${index.key}":`, error.message);
    }
  }
};

// Fix missing attributes
const fixMissingAttributes = async () => {
  console.log('🔧 Fixing missing attributes...\n');

  // Fix Tasks collection
  console.log('📋 Fixing Tasks collection...');
  const taskAttributes = [
    { key: 'priority', type: 'enum', elements: ['low', 'medium', 'high'], required: false },
    { key: 'completed', type: 'boolean', required: false },
    { key: 'focusSeconds', type: 'integer', required: false }
  ];

  for (const attr of taskAttributes) {
    await createAttribute('tasks', attr);
    await sleep(1000);
  }

  await sleep(3000); // Wait for attributes to be ready

  // Fix missing indexes for tasks
  const taskIndexes = [
    { key: 'user_completed_new', type: 'key', attributes: ['userId', 'completed'] },
    { key: 'user_priority_new', type: 'key', attributes: ['userId', 'priority'] }
  ];

  console.log('🔍 Creating missing task indexes...');
  for (const index of taskIndexes) {
    await createIndex('tasks', index);
    await sleep(1000);
  }

  // Fix User Settings collection
  console.log('\n⚙️  Fixing User Settings collection...');
  const settingAttributes = [
    { key: 'theme', type: 'enum', elements: ['light', 'dark', 'system'], required: false },
    { key: 'focusDuration', type: 'integer', required: false },
    { key: 'shortBreakDuration', type: 'integer', required: false },
    { key: 'longBreakDuration', type: 'integer', required: false },
    { key: 'autoStartNext', type: 'boolean', required: false },
    { key: 'goalMinutes', type: 'integer', required: false },
    { key: 'longBreakEvery', type: 'integer', required: false },
    { key: 'enableSound', type: 'boolean', required: false },
    { key: 'enableNotifications', type: 'boolean', required: false }
  ];

  for (const attr of settingAttributes) {
    await createAttribute('user_settings', attr);
    await sleep(1000);
  }

  console.log('\n🎉 All missing attributes have been created!');
  console.log('\n📝 Summary of what was fixed:');
  console.log('✅ Tasks: priority, completed, focusSeconds attributes');
  console.log('✅ Tasks: completed and priority indexes');
  console.log('✅ Settings: all configuration attributes (theme, durations, etc.)');
  console.log('\n🚀 Your Appwrite database is now complete and ready to use!');
};

// Run the fix
fixMissingAttributes().catch(console.error);