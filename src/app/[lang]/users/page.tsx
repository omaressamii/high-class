
// 'use client'; // Removed to make it a Server Component

import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import { UserList } from '@/components/users/UserList';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users as UsersIcon, Loader } from 'lucide-react';
import { ClientAuthWrapperForUsersPage } from '@/components/users/ClientAuthWrapperForUsersPage';
import { ref, get, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import type { User, Branch } from '@/types'; // Added Branch

async function getUsersFromRealtimeDB(): Promise<User[]> {
  const usersRef = ref(database, "users");
  // console.log("Attempting to fetch users from Realtime Database for UsersPage...");

  try {
    const userSnapshot = await get(usersRef);

    if (!userSnapshot.exists()) {
      // console.log("No users found in Realtime Database.");
      return [];
    }

    const usersData = userSnapshot.val();
    // console.log(`Fetched users data from Realtime Database for UsersPage.`);

    const userListPromises: Promise<User>[] = Object.entries(usersData).map(async ([userId, data]: [string, any]) => {
      let branchName = data.branchName; // Use existing branchName if available

      // If branchId exists but branchName doesn't, fetch branchName
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
        branchName: branchName, // Use fetched or existing branchName
      } as User;
    });

    const userList = await Promise.all(userListPromises);

    // Sort by fullName (since Realtime DB doesn't have built-in orderBy like Firestore)
    userList.sort((a, b) => a.fullName.localeCompare(b.fullName));

    return userList;

  } catch (error) {
    console.error("Realtime Database fetch error in getUsersFromRealtimeDB (UsersPage): ", error);
    return [];
  }
}

export default async function UsersPage({ params: routeParams }: { params: Promise<{ lang: string }> }) {
  const { lang } = await routeParams;
  const pageLang = lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const users = await getUsersFromRealtimeDB();

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إدارة المستخدمين' : 'User Management',
    addUser: effectiveLang === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User',
    noUsers: effectiveLang === 'ar' ? 'لا يوجد مستخدمون حاليًا.' : 'No users found.',
    loadingPage: effectiveLang === 'ar' ? 'جار تحميل الصفحة...' : 'Loading page...',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <ClientAuthWrapperForUsersPage lang={effectiveLang} addUserText={t.addUser} />
      </div>

      {users.length > 0 ? (
        <UserList users={users} lang={effectiveLang} />
      ) : (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mt-4">{t.noUsers}</p>
        </div>
      )}
    </div>
  );
}
