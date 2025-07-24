/**
 * Script to fix duplicate order codes in Firebase Realtime Database
 * Run this script to identify and repair duplicate order codes
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://highclass-d5aac-default-rtdb.firebaseio.com/"
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.log('Please make sure you have a valid serviceAccountKey.json file in the project root');
  process.exit(1);
}

const db = admin.database();

/**
 * Finds all orders with duplicate order codes
 */
async function findDuplicateOrderCodes() {
  try {
    console.log('🔍 Scanning for duplicate order codes...');
    
    const ordersRef = db.ref('orders');
    const snapshot = await ordersRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('📭 No orders found in database');
      return {};
    }

    const orders = snapshot.val();
    const codeToOrderIds = {};
    const orderDetails = {};
    
    // Group order IDs by order code and collect order details
    for (const [orderId, orderData] of Object.entries(orders)) {
      const orderCode = orderData.orderCode;
      if (orderCode) {
        if (!codeToOrderIds[orderCode]) {
          codeToOrderIds[orderCode] = [];
        }
        codeToOrderIds[orderCode].push(orderId);
        orderDetails[orderId] = {
          orderCode,
          customerName: orderData.customerName || 'Unknown',
          orderDate: orderData.orderDate || 'Unknown',
          totalPrice: orderData.totalPrice || 0,
          createdAt: orderData.createdAt || 'Unknown'
        };
      }
    }

    // Filter to only include codes with duplicates
    const duplicates = {};
    for (const [code, orderIds] of Object.entries(codeToOrderIds)) {
      if (orderIds.length > 1) {
        duplicates[code] = orderIds.map(id => ({
          id,
          ...orderDetails[id]
        }));
      }
    }

    console.log(`📊 Found ${Object.keys(duplicates).length} duplicate order codes`);
    
    // Display duplicate details
    for (const [code, orders] of Object.entries(duplicates)) {
      console.log(`\n🔴 Duplicate Code: ${code}`);
      orders.forEach((order, index) => {
        console.log(`  ${index + 1}. Order ID: ${order.id}`);
        console.log(`     Customer: ${order.customerName}`);
        console.log(`     Date: ${order.orderDate}`);
        console.log(`     Total: ${order.totalPrice}`);
        console.log(`     Created: ${order.createdAt}`);
      });
    }

    return duplicates;
  } catch (error) {
    console.error('❌ Error finding duplicate order codes:', error);
    throw error;
  }
}

/**
 * Generates a new unique order code
 */
async function generateNewOrderCode() {
  try {
    const counterRef = db.ref('system_settings/orderCodeConfig');
    const counterSnap = await counterRef.once('value');
    
    let nextCode;
    if (!counterSnap.exists() || !counterSnap.val()?.nextOrderCode) {
      nextCode = 70000001;
      await counterRef.set({ nextOrderCode: nextCode + 1 });
    } else {
      nextCode = counterSnap.val().nextOrderCode;
      await counterRef.update({ nextOrderCode: nextCode + 1 });
    }
    
    return String(nextCode);
  } catch (error) {
    console.error('❌ Error generating new order code:', error);
    throw error;
  }
}

/**
 * Repairs duplicate order codes by assigning new unique codes
 */
async function repairDuplicateOrderCodes(duplicates, dryRun = true) {
  const results = {
    repaired: 0,
    errors: []
  };

  console.log(`\n🔧 ${dryRun ? 'DRY RUN - ' : ''}Starting repair process...`);

  for (const [duplicateCode, orders] of Object.entries(duplicates)) {
    console.log(`\n🔄 Processing duplicate code: ${duplicateCode}`);
    
    // Keep the first order (usually the oldest), update the rest
    const ordersToUpdate = orders.slice(1);
    
    console.log(`  ✅ Keeping original: ${orders[0].id} (${orders[0].customerName})`);
    
    for (const order of ordersToUpdate) {
      try {
        const newCode = await generateNewOrderCode();
        
        console.log(`  🔄 Updating ${order.id} (${order.customerName}): ${duplicateCode} → ${newCode}`);
        
        if (!dryRun) {
          const orderRef = db.ref(`orders/${order.id}`);
          await orderRef.update({
            orderCode: newCode,
            updatedAt: new Date().toISOString(),
            repairNote: `Order code updated from ${duplicateCode} to ${newCode} on ${new Date().toISOString()}`
          });
        }
        
        results.repaired++;
      } catch (error) {
        const errorMsg = `Failed to repair order ${order.id}: ${error.message}`;
        console.error(`  ❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }
  }

  return results;
}

/**
 * Validates the current order code counter
 */
async function validateOrderCodeCounter() {
  try {
    console.log('\n🔍 Validating order code counter...');
    
    const counterRef = db.ref('system_settings/orderCodeConfig');
    const counterSnap = await counterRef.once('value');
    
    if (!counterSnap.exists()) {
      console.log('⚠️  Order code counter not found, initializing...');
      await counterRef.set({ nextOrderCode: 70000001 });
      console.log('✅ Order code counter initialized to 70000001');
      return;
    }

    const currentCounter = counterSnap.val().nextOrderCode;
    console.log(`📊 Current counter value: ${currentCounter}`);

    // Find the highest existing order code
    const ordersRef = db.ref('orders');
    const ordersSnap = await ordersRef.once('value');
    
    if (ordersSnap.exists()) {
      const orders = ordersSnap.val();
      let highestCode = 0;
      
      for (const orderData of Object.values(orders)) {
        if (orderData.orderCode) {
          const codeNum = parseInt(orderData.orderCode);
          if (!isNaN(codeNum) && codeNum > highestCode) {
            highestCode = codeNum;
          }
        }
      }
      
      console.log(`📊 Highest existing order code: ${highestCode}`);
      
      if (currentCounter <= highestCode) {
        const newCounter = highestCode + 1;
        console.log(`⚠️  Counter is behind highest code, updating to: ${newCounter}`);
        await counterRef.update({ nextOrderCode: newCounter });
        console.log('✅ Counter updated successfully');
      } else {
        console.log('✅ Counter is valid');
      }
    }
  } catch (error) {
    console.error('❌ Error validating counter:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Order Code Repair Tool');
  console.log('==========================\n');

  try {
    // Step 1: Validate counter
    await validateOrderCodeCounter();

    // Step 2: Find duplicates
    const duplicates = await findDuplicateOrderCodes();
    
    if (Object.keys(duplicates).length === 0) {
      console.log('\n✅ No duplicate order codes found. Database is healthy!');
      process.exit(0);
    }

    // Step 3: Show repair plan (dry run)
    console.log('\n📋 REPAIR PLAN (Dry Run)');
    console.log('========================');
    const dryRunResults = await repairDuplicateOrderCodes(duplicates, true);
    console.log(`\n📊 Dry Run Results:`);
    console.log(`  - Orders to repair: ${dryRunResults.repaired}`);
    console.log(`  - Potential errors: ${dryRunResults.errors.length}`);

    if (dryRunResults.errors.length > 0) {
      console.log('\n❌ Potential errors:');
      dryRunResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Step 4: Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('\n❓ Do you want to proceed with the repair? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('🚫 Repair cancelled by user');
      process.exit(0);
    }

    // Step 5: Perform actual repair
    console.log('\n🔧 PERFORMING ACTUAL REPAIR');
    console.log('============================');
    const repairResults = await repairDuplicateOrderCodes(duplicates, false);
    
    console.log('\n📊 REPAIR COMPLETED');
    console.log('===================');
    console.log(`✅ Successfully repaired: ${repairResults.repaired} orders`);
    
    if (repairResults.errors.length > 0) {
      console.log(`❌ Errors encountered: ${repairResults.errors.length}`);
      repairResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n🎉 Order code repair process completed!');
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}
