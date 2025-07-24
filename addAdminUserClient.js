
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// Firebase configuration - you need to fill in your actual values
const firebaseConfig = {
  apiKey: "your_api_key_here", // Replace with your actual API key
  authDomain: "your_project_id.firebaseapp.com", // Replace with your actual auth domain
  databaseURL: "https://highclass-d5aac-default-rtdb.firebaseio.com/",
  projectId: "your_project_id", // Replace with your actual project ID
  storageBucket: "your_project_id.appspot.com", // Replace with your actual storage bucket
  messagingSenderId: "your_messaging_sender_id", // Replace with your actual sender ID
  appId: "your_app_id" // Replace with your actual app ID
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
  console.log('Database URL: https://highclass-d5aac-default-rtdb.firebaseio.com/');
  console.log('');
  
  // Check if configuration is filled
  if (firebaseConfig.apiKey === "your_api_key_here") {
    console.log('❌ Please update the Firebase configuration in this script with your actual values!');
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
