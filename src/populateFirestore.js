
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

const PERMISSION_STRINGS_FROM_TYPES = [
  'dashboard_view',
  'products_view', 'products_add', 'products_edit', 'products_delete', 'products_availability_view',
  'customers_view', 'customers_manage',
  'orders_view', 'orders_add', 'orders_edit', 'orders_edit_price', 'orders_delete', 'orders_prepare',
  'returns_receive',
  'financials_view', 'payments_record',
  'reports_view',
  'users_view', 'users_manage',
  'branches_manage', 'view_all_branches'
];

const defaultPermissionsValues = ['dashboard_view'];
const allPermissions = [...PERMISSION_STRINGS_FROM_TYPES];
const cashierPermissions = [
  'dashboard_view',
  'products_view', 'products_add', 'products_availability_view', 'customers_view', 'customers_manage',
  'orders_view', 'orders_add', 'orders_edit', 'orders_edit_price', 'orders_prepare', 'returns_receive',
  'financials_view', 'payments_record',
];

const mockUsersData = [];

const mockProductsData = [
  {
    name: 'بدلة سوداء كلاسيكية فاخرة', type: 'suit', category: 'Rental', size: 'L', price: 150,
    initialStock: 8, quantityInStock: 8, quantityRented: 0, status: 'Available',
    imageUrl: 'https://placehold.co/600x400.png', description: 'بدلة سوداء أنيقة تناسب جميع المناسبات الرسمية.',
    notes: 'متوفر معها ربطة عنق وحزام.', 'data-ai-hint': 'black suit', branchId: 'B001', branchName: 'الفرع الرئيسي - الرياض', isGlobalProduct: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    name: 'فستان زفاف الأحلام الأبيض', type: 'dress', category: 'Sale', size: 'M', price: 1200,
    initialStock: 3, quantityInStock: 3, quantityRented: 0, status: 'Available',
    imageUrl: 'https://placehold.co/600x400.png', description: 'فستان زفاف أبيض بتصميم فريد.',
    'data-ai-hint': 'wedding dress white', branchId: 'B002', branchName: 'فرع جدة', isGlobalProduct: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

const mockCustomersData = [
  { fullName: 'أليس عبد الرحمن النمر', phoneNumber: '0501234567', address: '123 شارع الأحلام، مدينة الخيال', idCardNumber: 'ID1234567890', notes: 'تبحث عن فستان.', createdAt: admin.firestore.FieldValue.serverTimestamp() },
  { fullName: 'باسم النجار الفايد', phoneNumber: '0535556789', address: '456 طريق الإنشاءات، مدينة الأدوات', notes: 'يبحث عن بدلة.', createdAt: admin.firestore.FieldValue.serverTimestamp() },
];

const mockBranchesData = [
    { id: 'B001', name: 'الفرع الرئيسي - الرياض', address: '123 شارع العليا، الرياض', phoneNumber: '0112345678', notes: 'الفرع الرئيسي', createdByUserId: 'SYSTEM_INIT', createdAt: admin.firestore.FieldValue.serverTimestamp() },
    { id: 'B002', name: 'فرع جدة', address: '456 طريق الملك عبد العزيز، جدة', phoneNumber: '0123456789', notes: 'فرع المنطقة الغربية', createdByUserId: 'SYSTEM_INIT', createdAt: admin.firestore.FieldValue.serverTimestamp() },
    { id: 'B003', name: 'فرع الدمام', address: '789 شارع الأمير محمد بن فهد، الدمام', phoneNumber: '0134567890', notes: 'فرع المنطقة الشرقية', createdByUserId: 'SYSTEM_INIT', createdAt: admin.firestore.FieldValue.serverTimestamp() }
];

const initialProductTypes = [
  { id: 'suit', name: 'Suit', name_ar: 'بدلة', createdAt: admin.firestore.FieldValue.serverTimestamp() },
  { id: 'dress', name: 'Dress', name_ar: 'فستان', createdAt: admin.firestore.FieldValue.serverTimestamp() },
  { id: 'abaya', name: 'Abaya', name_ar: 'عباءة', createdAt: admin.firestore.FieldValue.serverTimestamp() },
];


const mockOrdersData = [
  {
    orderCode: '70000001',
    items: [
      { productId: 'PRODUCT_ID_1_FROM_FIRESTORE', productName: 'بدلة سوداء كلاسيكية فاخرة', productCode: 'CODE_FOR_P1', quantity: 1, priceAtTimeOfOrder: 150 },
    ],
    customerId: 'CUSTOMER_ID_1_FROM_FIRESTORE',
    customerName: 'أليس عبد الرحمن النمر',
    processedByUserId: 'USER_ID_CASHIER_FROM_FIRESTORE',
    processedByUserName: 'Cashier One',
    branchId: 'B001',
    branchName: 'الفرع الرئيسي - الرياض',
    transactionType: 'Rental',
    orderDate: '2025-07-01',
    deliveryDate: '2025-07-05',
    returnDate: '2025-07-10',
    totalPrice: 150,
    paidAmount: 50,
    remainingAmount: 100,
    status: 'Ongoing',
    notes: 'الطلب الأولي متعدد العناصر.',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }
];


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

async function initializeCounter(docId, fieldName, initialValue) {
  const counterRef = db.ref(`system_settings/${docId}`);
  try {
    const counterSnap = await counterRef.once('value');
    const counterData = counterSnap.val();
    if (!counterData || typeof counterData[fieldName] !== 'number') {
      await counterRef.set({ [fieldName]: initialValue });
      console.log(`${docId} counter initialized at ${initialValue}.`);
    } else {
      console.log(`${docId} counter already exists with value: ${counterData[fieldName]}.`);
    }
  } catch (error) {
    console.error(`Error initializing ${docId} counter:`, error);
  }
}

async function initializeProductTypes() {
    const productTypesConfigRef = db.ref('system_settings/productTypesConfig');
    try {
        const docSnap = await productTypesConfigRef.once('value');
        const configData = docSnap.val();
        if (!configData || !configData.types || configData.types.length === 0) {
            console.log('Initializing product types in system_settings/productTypesConfig...');
            await productTypesConfigRef.set({ types: initialProductTypes });
            console.log('Product types initialized successfully.');
        } else {
            console.log('Product types already exist in system_settings/productTypesConfig.');
        }
    } catch (error) {
        console.error('Error initializing product types:', error);
    }
}

async function main() {
  console.log('Starting Realtime Database population script...');

  await initializeCounter('productCodeConfig', 'nextProductCode', 90000001);
  await initializeCounter('orderCodeConfig', 'nextOrderCode', 70000001);
  await initializeProductTypes();

  console.log('Populating branches...');
  await deleteCollectionContents('branches');
  await populateCollection('branches', mockBranchesData, true);

  console.log('Populating users...');
  await deleteCollectionContents('users');
  await populateCollection('users', mockUsersData, true);

  console.log('Populating products...');
  await deleteCollectionContents('products');
  await populateCollection('products', mockProductsData);

  console.log('Populating customers...');
  await deleteCollectionContents('customers');
  await populateCollection('customers', mockCustomersData);

  console.log('Deleting existing orders from Realtime Database...');
  await deleteCollectionContents('orders');
  console.log('Existing orders deleted.');
  // await populateCollection('orders', mockOrdersData);

  console.log('Realtime Database population script finished.');
}

main().catch(console.error);
