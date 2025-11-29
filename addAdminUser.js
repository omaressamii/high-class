// Script to add an admin user to Firebase Realtime Database
require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://high-class-b8f26-default-rtdb.firebaseio.com/'
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.log('Please make sure you have a valid serviceAccountKey.json file');
  process.exit(1);
}

const db = admin.database();

async function addAdminUser() {
  console.log('Adding admin user to Firebase Realtime Database...');
  
  const adminUser = {
    username: 'admin',
    password: 'admin123', // Change this to a secure password
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
    const adminRef = db.ref('users/admin-001');
    await adminRef.set(adminUser);
    
    console.log('✅ Admin user added successfully!');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
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
    const branchRef = db.ref('branches/B001');
    await branchRef.set(defaultBranch);
    console.log('✅ Default branch added successfully!');
  } catch (error) {
    console.error('❌ Error adding default branch:', error);
  }
}

async function initializeCounters() {
  console.log('Initializing system counters...');
  
  try {
    // Initialize product code counter
    const productCodeRef = db.ref('system_settings/productCodeConfig');
    await productCodeRef.set({ nextProductCode: 90000001 });
    
    // Initialize order code counter
    const orderCodeRef = db.ref('system_settings/orderCodeConfig');
    await orderCodeRef.set({ nextOrderCode: 70000001 });
    
    console.log('✅ System counters initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing counters:', error);
  }
}

async function main() {
  console.log('🚀 Setting up Firebase Realtime Database with admin user...');
  console.log('Database URL:', process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
  console.log('');
  
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
  } finally {
    process.exit(0);
  }
}

main();
