'use client';

import React, { useState, useEffect } from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { UserList } from '@/components/users/UserList';
import { ClientAuthWrapperForUsersPage } from '@/components/users/ClientAuthWrapperForUsersPage';
import { Users as UsersIcon } from 'lucide-react';
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import type { User, Branch } from '@/types';

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

  const t = {
    pageTitle: lang === 'ar' ? 'إدارة المستخدمين' : 'User Management',
    addUser: lang === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User',
    noUsers: lang === 'ar' ? 'لا يوجد مستخدمون حاليًا.' : 'No users found.',
  };

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

      {users.length > 0 ? (
        <UserList users={users} lang={lang} onUserDeleted={handleUserDeleted} />
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
