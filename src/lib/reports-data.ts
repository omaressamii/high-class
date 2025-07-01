import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import type { Order, Product, Customer, User as AppUser } from '@/types';
import { addDays, isWithinInterval } from 'date-fns';

/**
 * Helper function to fetch all necessary data from Firebase
 */
async function fetchAllData() {
  const [ordersSnapshot, productsSnapshot, customersSnapshot, usersSnapshot] = await Promise.all([
    get(ref(database, "orders")),
    get(ref(database, "products")),
    get(ref(database, "customers")),
    get(ref(database, "users"))
  ]);

  let orders: Order[] = [];
  let products: Product[] = [];
  let customers: Customer[] = [];
  let users: AppUser[] = [];

  if (ordersSnapshot.exists()) {
    const ordersData = ordersSnapshot.val();
    orders = Object.entries(ordersData).map(([id, data]: [string, any]) => ({ id, ...data } as Order));
  }

  if (productsSnapshot.exists()) {
    const productsData = productsSnapshot.val();
    products = Object.entries(productsData).map(([id, data]: [string, any]) => ({ id, ...data } as Product));
  }

  if (customersSnapshot.exists()) {
    const customersData = customersSnapshot.val();
    customers = Object.entries(customersData).map(([id, data]: [string, any]) => ({ id, ...data } as Customer));
  }

  if (usersSnapshot.exists()) {
    const usersData = usersSnapshot.val();
    users = Object.entries(usersData).map(([id, data]: [string, any]) => ({ id, ...data } as AppUser));
  }

  return { orders, products, customers, users };
}

/**
 * Helper function to enrich order data with related information
 */
function enrichOrderData(order: Order, products: Product[], customers: Customer[], users: AppUser[], lang: 'ar' | 'en') {
  // Find related data
  let productName = 'Unknown Product';
  let customerName = 'Unknown Customer';
  let sellerName = lang === 'ar' ? 'بائع غير معروف' : 'Unknown Seller';

  // Get product name from items or find by productId (for backward compatibility)
  if (order.items && order.items.length > 0) {
    productName = order.items[0].productName;
  } else if (order.productId) {
    const product = products.find(p => p.id === order.productId);
    productName = product?.name || order.productId;
  }

  // Get customer name
  const customer = customers.find(c => c.id === order.customerId);
  customerName = customer?.fullName || order.customerName || order.customerId;

  // Get seller name
  if (order.sellerId) {
    const seller = users.find(u => u.id === order.sellerId);
    sellerName = seller?.fullName || order.sellerName || sellerName;
  }

  return {
    ...order,
    productName,
    customerName,
    sellerName,
  };
}

/**
 * Get active rentals data
 */
export async function getActiveRentalsData(lang: 'ar' | 'en') {
  try {
    const { orders, products, customers, users } = await fetchAllData();

    // Filter active rentals and enrich with related data
    const activeRentals = orders
      .filter(order => order.transactionType === 'Rental' && order.status === 'Ongoing')
      .map(order => enrichOrderData(order, products, customers, users, lang))
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return activeRentals;
  } catch (error) {
    console.error("Error fetching active rentals data:", error);
    return [];
  }
}

/**
 * Get sales data
 */
export async function getSalesData(lang: 'ar' | 'en') {
  try {
    const { orders, products, customers, users } = await fetchAllData();

    // Filter sales and enrich with related data
    const salesOrders = orders
      .filter(order => order.transactionType === 'Sale')
      .map(order => enrichOrderData(order, products, customers, users, lang))
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return salesOrders;
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return [];
  }
}

/**
 * Get upcoming returns data (rentals due within the next 7 days)
 */
export async function getUpcomingReturnsData(lang: 'ar' | 'en') {
  try {
    const { orders, products, customers, users } = await fetchAllData();

    const today = new Date();
    const nextWeek = addDays(today, 7);

    // Filter upcoming returns (rentals with return dates within the next 7 days)
    const upcomingReturns = orders
      .filter(order => {
        if (order.transactionType !== 'Rental' || order.status !== 'Ongoing' || !order.returnDate) {
          return false;
        }
        
        const returnDate = new Date(order.returnDate);
        return isWithinInterval(returnDate, { start: today, end: nextWeek });
      })
      .map(order => enrichOrderData(order, products, customers, users, lang))
      .sort((a, b) => new Date(a.returnDate!).getTime() - new Date(b.returnDate!).getTime());

    return upcomingReturns;
  } catch (error) {
    console.error("Error fetching upcoming returns data:", error);
    return [];
  }
}

/**
 * Get overdue returns data (rentals past their return date)
 */
export async function getOverdueReturnsData(lang: 'ar' | 'en') {
  try {
    const { orders, products, customers, users } = await fetchAllData();

    const today = new Date();

    // Filter overdue returns
    const overdueReturns = orders
      .filter(order => {
        if (order.transactionType !== 'Rental' || order.status !== 'Ongoing' || !order.returnDate) {
          return false;
        }
        
        const returnDate = new Date(order.returnDate);
        return returnDate < today;
      })
      .map(order => enrichOrderData(order, products, customers, users, lang))
      .sort((a, b) => new Date(a.returnDate!).getTime() - new Date(b.returnDate!).getTime());

    return overdueReturns;
  } catch (error) {
    console.error("Error fetching overdue returns data:", error);
    return [];
  }
}

/**
 * Get product types data with sales and rental statistics
 */
export async function getProductTypesData(
  lang: 'ar' | 'en',
  filters?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
  }
) {
  try {
    const { orders, products } = await fetchAllData();

    // Fetch product types from Firebase
    const typesConfigRef = ref(database, 'system_settings/productTypesConfig');
    const typesSnapshot = await get(typesConfigRef);
    let productTypes: any[] = [];

    if (typesSnapshot.exists()) {
      productTypes = typesSnapshot.val().types || [];
    }

    // Create a map of product type statistics
    const typeStats: Record<string, {
      id: string;
      name: string;
      name_ar: string;
      totalProducts: number;
      totalSales: number;
      totalRentals: number;
      salesRevenue: number;
      rentalRevenue: number;
      availableProducts: number;
      rentedProducts: number;
      soldProducts: number;
    }> = {};

    // Initialize stats for each product type
    productTypes.forEach(type => {
      typeStats[type.id] = {
        id: type.id,
        name: type.name,
        name_ar: type.name_ar,
        totalProducts: 0,
        totalSales: 0,
        totalRentals: 0,
        salesRevenue: 0,
        rentalRevenue: 0,
        availableProducts: 0,
        rentedProducts: 0,
        soldProducts: 0,
      };
    });

    // Count products by type and status
    products.forEach(product => {
      if (typeStats[product.type]) {
        typeStats[product.type].totalProducts++;

        switch (product.status) {
          case 'Available':
            typeStats[product.type].availableProducts++;
            break;
          case 'Rented':
            typeStats[product.type].rentedProducts++;
            break;
          case 'Sold':
            typeStats[product.type].soldProducts++;
            break;
        }
      }
    });

    // Filter orders based on date range and branch
    let filteredOrders = orders;

    if (filters?.startDate || filters?.endDate || filters?.branchId) {
      filteredOrders = orders.filter(order => {
        // Date filtering
        if (filters.startDate && order.orderDate < filters.startDate) {
          return false;
        }
        if (filters.endDate && order.orderDate > filters.endDate) {
          return false;
        }

        // Branch filtering
        if (filters.branchId && filters.branchId !== 'all' && order.branchId !== filters.branchId) {
          return false;
        }

        return true;
      });
    }

    // Count orders by product type
    filteredOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          // Find product to get its type
          const product = products.find(p => p.id === item.productId);
          if (product && typeStats[product.type]) {
            const revenue = item.priceAtTimeOfOrder * item.quantity;

            if (order.transactionType === 'Sale') {
              typeStats[product.type].totalSales += item.quantity;
              typeStats[product.type].salesRevenue += revenue;
            } else if (order.transactionType === 'Rental') {
              typeStats[product.type].totalRentals += item.quantity;
              typeStats[product.type].rentalRevenue += revenue;
            }
          }
        });
      } else if (order.productId) {
        // Handle old format orders
        const product = products.find(p => p.id === order.productId);
        if (product && typeStats[product.type]) {
          if (order.transactionType === 'Sale') {
            typeStats[product.type].totalSales++;
            typeStats[product.type].salesRevenue += (order.totalPrice || 0);
          } else if (order.transactionType === 'Rental') {
            typeStats[product.type].totalRentals++;
            typeStats[product.type].rentalRevenue += (order.totalPrice || 0);
          }
        }
      }
    });

    // Convert to array and sort by total revenue (sales + rental)
    const typeStatsArray = Object.values(typeStats)
      .map(stat => ({
        ...stat,
        totalRevenue: stat.salesRevenue + stat.rentalRevenue,
        displayName: lang === 'ar' ? stat.name_ar : stat.name,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return typeStatsArray;
  } catch (error) {
    console.error("Error fetching product types data:", error);
    return [];
  }
}

/**
 * Get all orders data with enriched information
 */
export async function getAllOrdersData(lang: 'ar' | 'en') {
  try {
    const { orders, products, customers, users } = await fetchAllData();

    // Enrich all orders with related data
    const enrichedOrders = orders
      .map(order => enrichOrderData(order, products, customers, users, lang))
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return enrichedOrders;
  } catch (error) {
    console.error("Error fetching all orders data:", error);
    return [];
  }
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status: string, lang: 'ar' | 'en') {
  try {
    const { orders, products, customers, users } = await fetchAllData();

    // Filter orders by status and enrich with related data
    const filteredOrders = orders
      .filter(order => order.status === status)
      .map(order => enrichOrderData(order, products, customers, users, lang))
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return filteredOrders;
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    return [];
  }
}

/**
 * Get orders by transaction type
 */
export async function getOrdersByTransactionType(transactionType: 'Sale' | 'Rental', lang: 'ar' | 'en') {
  try {
    const { orders, products, customers, users } = await fetchAllData();

    // Filter orders by transaction type and enrich with related data
    const filteredOrders = orders
      .filter(order => order.transactionType === transactionType)
      .map(order => enrichOrderData(order, products, customers, users, lang))
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return filteredOrders;
  } catch (error) {
    console.error("Error fetching orders by transaction type:", error);
    return [];
  }
}
