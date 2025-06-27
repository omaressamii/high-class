
// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// IMPORTANT: Path to your service account key JSON file
// Make sure this file is in your .gitignore
const serviceAccount = require('./serviceAccountKey.json'); // Adjust path if needed

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://highclass-d5aac-default-rtdb.firebaseio.com/"
});

const db = admin.database();

// --- Updated UserPermissions structure to match src/types/index.ts ---
// These are now arrays of permission strings

const PERMISSION_STRINGS_FROM_TYPES = [
  'products_view',
  'products_add',
  'products_edit',
  'products_delete',
  'customers_view',
  'customers_manage',
  'orders_view',
  'orders_add',
  'orders_edit',
  'orders_delete',
  'returns_receive',
  'financials_view',
  'payments_record',
  'reports_view',
  'users_view',
  'users_manage',
  'branches_manage' // Added new permission
];

const defaultPermissionsValues = []; // Empty array for sellers or minimal users

const allPermissions = [...PERMISSION_STRINGS_FROM_TYPES];

const cashierPermissions = [
  'products_view',
  'products_add',
  'customers_view',
  'customers_manage',
  'orders_view',
  'orders_add',
  'orders_edit',
  'returns_receive',
  'financials_view',
  'payments_record',
];

const mockUsersData = [
  // {
  //   id: 'U001', // Firestore will auto-generate ID if not provided and useSpecificIds is false
  //   username: 'admin',
  //   password: 'password123', // WARNING: Storing plain text passwords is not secure for production
  //   fullName: 'Admin Full Name',
  //   isSeller: false,
  //   permissions: allPermissions,
  //   branchId: 'B001', // Example, assuming a branch with ID B001 exists
  //   branchName: 'الفرع الرئيسي',
  //   createdAt: admin.firestore.FieldValue.serverTimestamp(),
  // },
  // {
  //   id: 'U002',
  //   username: 'cashier1',
  //   password: 'password456',
  //   fullName: 'Cashier One',
  //   isSeller: false,
  //   permissions: cashierPermissions,
  //   branchId: 'B001',
  //   branchName: 'الفرع الرئيسي',
  //   createdAt: admin.firestore.FieldValue.serverTimestamp(),
  // },
  // {
  //   id: 'S001',
  //   username: 'seller_track_001', // Auto-generated if isSeller and no username provided by app logic
  //   fullName: 'Sales Person One (Tracking Only)',
  //   isSeller: true, // This user cannot log in, for tracking sales
  //   permissions: defaultPermissionsValues, // No login permissions
  //   branchId: null, // Or assign to a specific branch if sellers are branch-specific
  //   branchName: null,
  //   createdAt: admin.firestore.FieldValue.serverTimestamp(),
  // },
];

const mockProductsData = [
  {
    name: 'بدلة سوداء كلاسيكية فاخرة',
    type: 'Suit',
    category: 'Rental',
    size: 'L',
    price: 150,
    initialStock: 8,
    quantityInStock: 8,
    quantityRented: 0,
    status: 'Available',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'بدلة سوداء أنيقة تناسب جميع المناسبات الرسمية. مصنوعة من أجود أنواع الأقمشة الإيطالية.',
    notes: 'متوفر معها ربطة عنق وحزام جلد طبيعي.',
    'data-ai-hint': 'black suit',
  },
  {
    name: 'فستان زفاف الأحلام الأبيض',
    type: 'Dress',
    category: 'Sale',
    size: 'M',
    price: 1200,
    initialStock: 3,
    quantityInStock: 3,
    quantityRented: 0,
    status: 'Available',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'فستان زفاف أبيض بتصميم فريد يجمع بين الأناقة والفخامة. مزين بتطريزات يدوية دقيقة.',
    'data-ai-hint': 'wedding dress white',
  },
  // ... add more mock products if needed following the schema
];

const mockCustomersData = [
  {
    fullName: 'أليس عبد الرحمن النمر',
    phoneNumber: '0501234567',
    address: '123 شارع الأحلام، مدينة الخيال، الرمز البريدي 11223',
    idCardNumber: 'ID1234567890',
    notes: 'تفضل الأنماط الكلاسيكية القديمة وتبحث عن فستان لحفل زفاف ابنتها.',
  },
  {
    fullName: 'باسم النجار الفايد',
    phoneNumber: '0535556789',
    address: '456 طريق الإنشاءات، مدينة الأدوات، المنطقة الصناعية',
    notes: 'يبحث عن بدلة متينة وعملية لحضور حفل زفاف صديق، يفضل اللون الكحلي.',
  },
];

const mockBranchesData = [
    {
        id: 'B001',
        name: 'الفرع الرئيسي - الرياض',
        address: '123 شارع العليا، الرياض',
        phoneNumber: '0112345678',
        notes: 'الفرع الرئيسي والأكبر',
        createdByUserId: 'SYSTEM_INIT', // Or a specific admin user ID if known
        createdAt: new Date().toISOString(),
    },
    {
        id: 'B002',
        name: 'فرع جدة',
        address: '456 طريق الملك عبد العزيز، جدة',
        phoneNumber: '0123456789',
        notes: 'فرع المنطقة الغربية',
        createdByUserId: 'SYSTEM_INIT',
        createdAt: new Date().toISOString(),
    }
];

// Helper function to delete all data in a path
async function deleteCollectionContents(collectionPath) {
  const collectionRef = db.ref(collectionPath);
  try {
    const snapshot = await collectionRef.once('value');
    if (snapshot.exists()) {
      await collectionRef.remove();
      console.log(`All data deleted from ${collectionPath}.`);
    } else {
      console.log(`No data found in ${collectionPath}.`);
    }
  } catch (error) {
    console.error(`Error deleting data from ${collectionPath}:`, error);
  }
}


async function populateCollection(collectionName, data, useSpecificIds = false) {
  const collectionRef = db.ref(collectionName);
  let count = 0;
  for (const item of data) {
    try {
      const { id, ...itemData } = item;
      if (useSpecificIds && id) {
        await collectionRef.child(id).set(itemData);
      } else {
        await collectionRef.push(itemData);
      }
      count++;
    } catch (error) {
      console.error(`Error adding item to ${collectionName}: `, item, error);
    }
  }
  console.log(`Successfully added ${count} items to ${collectionName}.`);
}

async function main() {
  console.log('Starting Realtime Database population script...');

  // Populate Branches first if users depend on branchIds
  console.log('Deleting existing branches from Realtime Database...');
  await deleteCollectionContents('branches');
  console.log('Existing branches deleted.');
  await populateCollection('branches', mockBranchesData, true); // Use true if mockBranchesData has IDs

  console.log('Deleting existing users from Realtime Database...');
  await deleteCollectionContents('users');
  console.log('Existing users deleted.');
  await populateCollection('users', mockUsersData, true); // Use true if mockUsersData has IDs

  // Optionally, clear other collections if needed, for example:
  // console.log('Deleting existing products from Realtime Database...');
  // await deleteCollectionContents('products');
  // console.log('Existing products deleted.');
  await populateCollection('products', mockProductsData);

  // console.log('Deleting existing customers from Realtime Database...');
  // await deleteCollectionContents('customers');
  // console.log('Existing customers deleted.');
  await populateCollection('customers', mockCustomersData);

  // If you also want to clear orders and payments, uncomment these:
  // console.log('Deleting existing orders from Realtime Database...');
  // await deleteCollectionContents('orders');
  // console.log('Existing orders deleted.');

  // console.log('Deleting existing payments from Realtime Database...');
  // await deleteCollectionContents('payments');
  // console.log('Existing payments deleted.');


  console.log('Realtime Database population script finished.');
}

main().catch(console.error);
