
// 'use client'; // Removed to make it a Server Component

import React from 'react';
import { UsersPageClient } from '@/components/users/UsersPageClient';
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import type { User, Branch } from '@/types';

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

  return <UsersPageClient initialUsers={users} lang={effectiveLang} />;
}
