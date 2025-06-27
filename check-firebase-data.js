const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: 'AIzaSyBHXPdV8wk6zWYYYrjOJY0GiHxRs455wZA',
  authDomain: 'highclass-d5aac.firebaseapp.com',
  databaseURL: 'https://highclass-d5aac-default-rtdb.firebaseio.com/',
  projectId: 'highclass-d5aac',
  storageBucket: 'highclass-d5aac.firebasestorage.app',
  messagingSenderId: '257883415855',
  appId: '1:257883415855:web:b94506629ec72bf49e6dda'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function checkData() {
  try {
    console.log('=== Checking Firebase Realtime Database ===\n');
    
    console.log('Checking orders...');
    const ordersRef = ref(database, 'orders');
    const ordersSnapshot = await get(ordersRef);
    if (ordersSnapshot.exists()) {
      const orders = ordersSnapshot.val();
      console.log('Orders found:', Object.keys(orders).length);
      console.log('Sample order keys:', Object.keys(orders).slice(0, 3));
      const firstOrder = Object.values(orders)[0];
      console.log('First order sample:', {
        id: firstOrder.id || 'N/A',
        transactionType: firstOrder.transactionType,
        status: firstOrder.status,
        orderDate: firstOrder.orderDate,
        totalPrice: firstOrder.totalPrice
      });
    } else {
      console.log('No orders found');
    }

    console.log('\nChecking products...');
    const productsRef = ref(database, 'products');
    const productsSnapshot = await get(productsRef);
    if (productsSnapshot.exists()) {
      const products = productsSnapshot.val();
      console.log('Products found:', Object.keys(products).length);
      console.log('Sample product keys:', Object.keys(products).slice(0, 3));
      const firstProduct = Object.values(products)[0];
      console.log('First product sample:', {
        name: firstProduct.name,
        category: firstProduct.category,
        status: firstProduct.status,
        price: firstProduct.price
      });
    } else {
      console.log('No products found');
    }

    console.log('\nChecking users...');
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      console.log('Users found:', Object.keys(users).length);
      console.log('Sample user keys:', Object.keys(users).slice(0, 3));
      const firstUser = Object.values(users)[0];
      console.log('First user sample:', {
        fullName: firstUser.fullName,
        isSeller: firstUser.isSeller,
        branchName: firstUser.branchName
      });
    } else {
      console.log('No users found');
    }

    console.log('\nChecking customers...');
    const customersRef = ref(database, 'customers');
    const customersSnapshot = await get(customersRef);
    if (customersSnapshot.exists()) {
      const customers = customersSnapshot.val();
      console.log('Customers found:', Object.keys(customers).length);
      console.log('Sample customer keys:', Object.keys(customers).slice(0, 3));
      const firstCustomer = Object.values(customers)[0];
      console.log('First customer sample:', {
        fullName: firstCustomer.fullName,
        phoneNumber: firstCustomer.phoneNumber
      });
    } else {
      console.log('No customers found');
    }

    console.log('\nChecking branches...');
    const branchesRef = ref(database, 'branches');
    const branchesSnapshot = await get(branchesRef);
    if (branchesSnapshot.exists()) {
      const branches = branchesSnapshot.val();
      console.log('Branches found:', Object.keys(branches).length);
      console.log('Sample branch keys:', Object.keys(branches).slice(0, 3));
      const firstBranch = Object.values(branches)[0];
      console.log('First branch sample:', {
        name: firstBranch.name,
        address: firstBranch.address
      });
    } else {
      console.log('No branches found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
