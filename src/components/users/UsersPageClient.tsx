'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { UserList } from '@/components/users/UserList';
import { ClientAuthWrapperForUsersPage } from '@/components/users/ClientAuthWrapperForUsersPage';
import { Users as UsersIcon, Search, Filter } from 'lucide-react';
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import type { User, Branch, FinancialTransaction, UserCashout } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOptimizedAuth } from '@/hooks/use-optimized-auth';

interface UsersPageClientProps {
  initialUsers: User[];
  lang: string;
}

async function getFinancialTransactionsFromRealtimeDB(): Promise<FinancialTransaction[]> {
  const transactionsRef = ref(database, "financial_transactions");

  try {
    const transactionSnapshot = await get(transactionsRef);

    if (!transactionSnapshot.exists()) {
      return [];
    }

    const transactionsData = transactionSnapshot.val();
    const transactionList: FinancialTransaction[] = [];

    Object.entries(transactionsData).forEach(([id, data]: [string, any]) => {
      try {
        const transaction: FinancialTransaction = {
          id: id,
          date: data.date,
          type: data.type,
          transactionCategory: data.transactionCategory,
          description: data.description,
          customerName: data.customerName,
          customerId: data.customerId,
          sellerName: data.sellerName,
          sellerId: data.sellerId,
          processedByUserId: data.processedByUserId,
          processedByUserName: data.processedByUserName,
          orderId: data.orderId,
          orderCode: data.orderCode,
          amount: Number(data.amount) || 0,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          branchId: data.branchId,
          branchName: data.branchName,
          createdAt: data.createdAt || new Date().toISOString(),
        };
        transactionList.push(transaction);
      } catch (error) {
        console.error(`Error parsing transaction ${id}:`, error);
      }
    });

    return transactionList;
  } catch (error) {
    console.error("Error fetching financial transactions:", error);
    return [];
  }
}

async function getUserCashoutsFromRealtimeDB(): Promise<UserCashout[]> {
  const cashoutsRef = ref(database, "user_cashouts");

  try {
    const cashoutSnapshot = await get(cashoutsRef);

    if (!cashoutSnapshot.exists()) {
      return [];
    }

    const cashoutsData = cashoutSnapshot.val();
    const cashoutList: UserCashout[] = [];

    Object.entries(cashoutsData).forEach(([id, data]: [string, any]) => {
      try {
        const cashout: UserCashout = {
          id: id,
          userId: data.userId,
          userName: data.userName,
          amount: Number(data.amount) || 0,
          cashoutDate: data.cashoutDate,
          processedByUserId: data.processedByUserId,
          processedByUserName: data.processedByUserName,
          branchId: data.branchId,
          branchName: data.branchName,
          notes: data.notes,
          createdAt: data.createdAt || new Date().toISOString(),
        };
        cashoutList.push(cashout);
      } catch (error) {
        console.error(`Error parsing cashout ${id}:`, error);
      }
    });

    return cashoutList;
  } catch (error) {
    console.error("Error fetching user cashouts:", error);
    return [];
  }
}

async function getUsersFromRealtimeDB(): Promise<User[]> {
  const usersRef = ref(database, "users");

  try {
    const userSnapshot = await get(usersRef);

    if (!userSnapshot.exists()) {
      return [];
    }

    const usersData = userSnapshot.val();

    const userListPromises: Promise<User>[] = Object.entries(usersData).map(async ([userId, data]: [string, any]) => {
      let branchName = data.branchName;

      if (data.branchId && !branchName) {
        try {
          const branchRef = ref(database, `branches/${data.branchId}`);
          const branchSnap = await get(branchRef);
          if (branchSnap.exists()) {
            branchName = (branchSnap.val() as Branch).name;
          }
        } catch (branchError) {
          console.error(`Error fetching branch name for user ${userId}:`, branchError);
        }
      }

      return {
        id: userId,
        username: data.username || '',
        fullName: data.fullName || 'N/A',
        isSeller: data.isSeller || false,
        isActive: data.isActive !== false, // Default to true if not set
        permissions: data.permissions || [],
        branchId: data.branchId,
        branchName: branchName,
      } as User;
    });

    const userList = await Promise.all(userListPromises);
    userList.sort((a, b) => a.fullName.localeCompare(b.fullName));

    return userList;

  } catch (error) {
    console.error("Realtime Database fetch error in getUsersFromRealtimeDB: ", error);
    return [];
  }
}

const UsersPageClient = ({ initialUsers, lang }: UsersPageClientProps) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [cashouts, setCashouts] = useState<UserCashout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Get current user
  const { user: currentUser } = useOptimizedAuth();

  // Load financial transactions and cashouts on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedTransactions, fetchedCashouts] = await Promise.all([
          getFinancialTransactionsFromRealtimeDB(),
          getUserCashoutsFromRealtimeDB()
        ]);
        setTransactions(fetchedTransactions);
        setCashouts(fetchedCashouts);
      } catch (error) {
        console.error("Error loading financial data:", error);
      }
    };

    loadData();
  }, []);

  const t = {
    pageTitle: lang === 'ar' ? 'إدارة المستخدمين' : 'User Management',
    addUser: lang === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User',
    noUsers: lang === 'ar' ? 'لا يوجد مستخدمون حاليًا.' : 'No users found.',
    filterUsers: lang === 'ar' ? 'فلترة المستخدمين' : 'Filter Users',
    searchLabel: lang === 'ar' ? 'البحث' : 'Search',
    searchPlaceholder: lang === 'ar' ? 'ابحث بالاسم أو اسم المستخدم أو الفرع...' : 'Search by name, username, or branch...',
    statusFilter: lang === 'ar' ? 'فلترة حسب الحالة' : 'Filter by Status',
    allUsers: lang === 'ar' ? 'جميع المستخدمين' : 'All Users',
    activeUsers: lang === 'ar' ? 'المستخدمين المفعلين' : 'Active Users',
    inactiveUsers: lang === 'ar' ? 'المستخدمين المعطلين' : 'Inactive Users',
  };

  // Filter users based on search term and status
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        const isActive = user.isActive !== false; // Default to true if not set
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        (user.branchName && user.branchName.toLowerCase().includes(searchLower)) ||
        user.id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [users, searchTerm, statusFilter]);

  const handleUserDeleted = async () => {
    setIsLoading(true);
    try {
      const updatedUsers = await getUsersFromRealtimeDB();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error refreshing users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashoutComplete = async () => {
    try {
      // Reload cashouts to reflect the new cashout record
      const updatedCashouts = await getUserCashoutsFromRealtimeDB();
      setCashouts(updatedCashouts);
    } catch (error) {
      console.error("Error refreshing cashouts after cashout:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <ClientAuthWrapperForUsersPage lang={lang} addUserText={t.addUser} />
      </div>

      {/* Search Filter */}
      <Card className="shadow-md rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="font-headline text-xl flex items-center">
            <Filter className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
            {t.filterUsers}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="userSearch">{t.searchLabel}</Label>
              <div className="relative">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userSearch"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-card pl-10 rtl:pr-10 rtl:pl-3"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="statusFilter">{t.statusFilter}</Label>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger id="statusFilter" className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allUsers}</SelectItem>
                  <SelectItem value="active">{t.activeUsers}</SelectItem>
                  <SelectItem value="inactive">{t.inactiveUsers}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length > 0 ? (
        <UserList
          users={filteredUsers}
          lang={lang}
          transactions={transactions}
          cashouts={cashouts}
          currentUser={currentUser}
          onUserDeleted={handleUserDeleted}
          onCashoutComplete={handleCashoutComplete}
        />
      ) : users.length > 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mt-4">
            {lang === 'ar' ? 'لا توجد نتائج للبحث' : 'No search results found'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {lang === 'ar' ? 'جرب مصطلح بحث مختلف' : 'Try a different search term'}
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mt-4">{t.noUsers}</p>
        </div>
      )}
    </div>
  );
};

UsersPageClient.displayName = 'UsersPageClient';
export { UsersPageClient };
