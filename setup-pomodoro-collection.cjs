const { Client, Databases, Permission, Role } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const collectionId = process.env.VITE_APPWRITE_POMODORO_COLLECTION_ID;

async function setupPomodoroCollection() {
  try {
    console.log('Setting up pomodoro_sessions collection...');
    
    // Try to create the collection (it might already exist)
    try {
      await databases.createCollection(
        databaseId,
        collectionId,
        'Pomodoro Sessions',
        [
          Permission.create(Role.users()),
          Permission.read(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ]
      );
      console.log('✓ Collection created');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ Collection already exists');
      } else {
        throw error;
      }
    }

    // Create attributes
    console.log('Creating attributes...');

    // userId (string) - required
    try {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        'userId',
        255,
        true // required
      );
      console.log('✓ Created userId attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ userId attribute already exists');
      } else {
        throw error;
      }
    }

    // sessionId (string) - required, unique
    try {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        'sessionId',
        255,
        true // required
      );
      console.log('✓ Created sessionId attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ sessionId attribute already exists');
      } else {
        throw error;
      }
    }

    // mode (string/enum) - required
    try {
      await databases.createEnumAttribute(
        databaseId,
        collectionId,
        'mode',
        ['focus', 'shortBreak', 'longBreak'],
        true // required
      );
      console.log('✓ Created mode attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ mode attribute already exists');
      } else {
        throw error;
      }
    }

    // startedAt (string/datetime) - required
    try {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        'startedAt',
        255,
        true // required
      );
      console.log('✓ Created startedAt attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ startedAt attribute already exists');
      } else {
        throw error;
      }
    }

    // endedAt (string/datetime) - optional
    try {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        'endedAt',
        255,
        false // optional
      );
      console.log('✓ Created endedAt attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ endedAt attribute already exists');
      } else {
        throw error;
      }
    }

    // durationSec (integer) - required
    try {
      await databases.createIntegerAttribute(
        databaseId,
        collectionId,
        'durationSec',
        true // required
      );
      console.log('✓ Created durationSec attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ durationSec attribute already exists');
      } else {
        throw error;
      }
    }

    // taskId (string) - optional
    try {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        'taskId',
        255,
        false // optional
      );
      console.log('✓ Created taskId attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ taskId attribute already exists');
      } else {
        throw error;
      }
    }

    // productivityRating (string) - optional
    try {
      await databases.createEnumAttribute(
        databaseId,
        collectionId,
        'productivityRating',
        ['veryLow', 'low', 'medium', 'high', 'veryHigh'],
        false // optional
      );
      console.log('✓ Created productivityRating attribute');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ productivityRating attribute already exists');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Pomodoro collection setup complete!');
    console.log('You can now start using pomodoro session tracking.');

    // Wait a bit for attributes to be ready
    console.log('\nWaiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create indexes for better query performance
    console.log('\nCreating indexes...');

    try {
      await databases.createIndex(
        databaseId,
        collectionId,
        'userId_index',
        'key',
        ['userId'],
        ['ASC']
      );
      console.log('✓ Created userId index');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ userId index already exists');
      } else {
        console.log('⚠️  Failed to create userId index:', error.message);
      }
    }

    try {
      await databases.createIndex(
        databaseId,
        collectionId,
        'startedAt_index',
        'key',
        ['startedAt'],
        ['DESC']
      );
      console.log('✓ Created startedAt index');
    } catch (error) {
      if (error.code === 409) {
        console.log('✓ startedAt index already exists');
      } else {
        console.log('⚠️  Failed to create startedAt index:', error.message);
      }
    }

    console.log('\n✅ All done!');
  } catch (error) {
    console.error('❌ Error setting up pomodoro collection:', error);
    process.exit(1);
  }
}

setupPomodoroCollection();
