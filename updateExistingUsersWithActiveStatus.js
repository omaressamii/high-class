/**
 * Script to update existing users with isActive = true
 * This script should be run once after implementing the user activation feature
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function updateExistingUsers() {
  console.log('Starting to update existing users with isActive = true...');
  
  try {
    // Get all users
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      console.log('No users found in the database.');
      return;
    }
    
    const users = snapshot.val();
    const userIds = Object.keys(users);
    
    console.log(`Found ${userIds.length} users to update.`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Update each user
    for (const userId of userIds) {
      const user = users[userId];
      
      // Check if user already has isActive property
      if (user.hasOwnProperty('isActive')) {
        console.log(`User ${user.fullName || userId} already has isActive property. Skipping.`);
        skippedCount++;
        continue;
      }
      
      // Update user with isActive = true
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, { 
        isActive: true,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✓ Updated user: ${user.fullName || user.username || userId}`);
      updatedCount++;
    }
    
    console.log('\n=== Update Summary ===');
    console.log(`Total users found: ${userIds.length}`);
    console.log(`Users updated: ${updatedCount}`);
    console.log(`Users skipped (already had isActive): ${skippedCount}`);
    console.log('Update completed successfully!');
    
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
}

// Run the update
updateExistingUsers()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
