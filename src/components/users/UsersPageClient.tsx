'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { UserList } from '@/components/users/UserList';
import { ClientAuthWrapperForUsersPage } from '@/components/users/ClientAuthWrapperForUsersPage';
import { Users as UsersIcon, Search, Filter } from 'lucide-react';
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import type { User, Branch } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UsersPageClientProps {
  initialUsers: User[];
  lang: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const t = {
    pageTitle: lang === 'ar' ? 'إدارة المستخدمين' : 'User Management',
    addUser: lang === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User',
    noUsers: lang === 'ar' ? 'لا يوجد مستخدمون حاليًا.' : 'No users found.',
    filterUsers: lang === 'ar' ? 'فلترة المستخدمين' : 'Filter Users',
    searchLabel: lang === 'ar' ? 'البحث' : 'Search',
    searchPlaceholder: lang === 'ar' ? 'ابحث بالاسم أو اسم المستخدم أو الفرع...' : 'Search by name, username, or branch...',
  };

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return users.filter(user =>
      user.fullName.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower) ||
      (user.branchName && user.branchName.toLowerCase().includes(searchLower)) ||
      user.id.toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm]);

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
        </CardContent>
      </Card>

      {filteredUsers.length > 0 ? (
        <UserList users={filteredUsers} lang={lang} onUserDeleted={handleUserDeleted} />
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
