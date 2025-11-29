
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// Firebase configuration - you need to fill in your actual values
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function addAdminUser() {
  console.log('Adding admin user to Firebase Realtime Database...');
  
  const adminUser = {
    username: 'admin',
    password: 'admin123',
    fullName: 'System Administrator',
    isSeller: false,
    permissions: [
      'users_view',
      'users_manage',
      'products_view',
      'products_manage',
      'products_delete',
      'customers_view',
      'customers_manage',
      'orders_view',
      'orders_manage',
      'financials_view',
      'financials_manage',
      'reports_view',
      'view_all_branches',
      'branches_manage',
      'database_backup',
      'database_restore'
    ],
    branchId: null,
    branchName: null,
    createdAt: new Date().toISOString(),
    createdByUserId: 'SYSTEM_INIT'
  };

  try {
    // Add admin user with a specific ID
    const adminRef = ref(database, 'users/admin-001');
    await set(adminRef, adminUser);
    
    console.log('✅ Admin user added successfully!');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    console.log('Make sure your Firebase configuration is correct and database rules allow writes.');
  }
}

async function addBasicBranch() {
  console.log('Adding default branch...');
  
  const defaultBranch = {
    name: 'الفرع الرئيسي', // Main Branch
    address: 'العنوان الرئيسي',
    phoneNumber: '01234567890',
    notes: 'الفرع الرئيسي للشركة',
    createdAt: new Date().toISOString(),
    createdByUserId: 'SYSTEM_INIT'
  };

  try {
    const branchRef = ref(database, 'branches/B001');
    await set(branchRef, defaultBranch);
    console.log('✅ Default branch added successfully!');
  } catch (error) {
    console.error('❌ Error adding default branch:', error);
  }
}

async function initializeCounters() {
  console.log('Initializing system counters...');
  
  try {
    // Initialize product code counter
    const productCodeRef = ref(database, 'system_settings/productCodeConfig');
    await set(productCodeRef, { nextProductCode: 90000001 });
    
    // Initialize order code counter
    const orderCodeRef = ref(database, 'system_settings/orderCodeConfig');
    await set(orderCodeRef, { nextOrderCode: 70000001 });
    
    console.log('✅ System counters initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing counters:', error);
  }
}

async function main() {
  console.log('🚀 Setting up Firebase Realtime Database with admin user...');
  console.log('Database URL:', firebaseConfig.databaseURL);
  console.log('');
  
  // Check if configuration is filled
  if (!firebaseConfig.apiKey) {
    console.log('❌ Please set FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY in your environment (.env.local)');
    console.log('You can find these values in your Firebase Console > Project Settings > General tab');
    process.exit(1);
  }
  
  try {
    await addAdminUser();
    await addBasicBranch();
    await initializeCounters();
    
    console.log('');
    console.log('🎉 Setup completed successfully!');
    console.log('You can now login to the application with:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('🔗 Application URL: http://localhost:9002/ar/login');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

main();
