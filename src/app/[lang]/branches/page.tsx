
// Convert to Server Component for data fetching
import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { BranchList } from '@/components/branches/BranchList';
import { ClientAuthWrapperForBranchesPage } from '@/components/branches/ClientAuthWrapperForBranchesPage';
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import type { Branch } from '@/types';
import { Store } from 'lucide-react'; // For empty state icon

async function getBranchesFromRealtimeDB(): Promise<Branch[]> {
  try {
    const branchesRef = ref(database, "branches");
    const branchSnapshot = await get(branchesRef);

    if (!branchSnapshot.exists()) {
      return [];
    }

    const branchesData = branchSnapshot.val();
    const branchList: Branch[] = Object.entries(branchesData).map(([id, data]: [string, any]) => {
      return {
        id,
        name: data.name || 'N/A',
        address: data.address,
        phoneNumber: data.phoneNumber,
        notes: data.notes,
        createdAt: data.createdAt,
        createdByUserId: data.createdByUserId,
      } as Branch;
    });

    // Sort by name ascending (since Realtime DB doesn't have built-in orderBy like Firestore)
    branchList.sort((a, b) => a.name.localeCompare(b.name));

    return branchList;
  } catch (error) {
    console.error("Realtime DB fetch error in getBranchesFromRealtimeDB (BranchesPage): ", error);
    return [];
  }
}

export default async function BranchesPage({ params: routeParams }: { params: Promise<{ lang: string }> }) {
  const { lang } = await routeParams;
  const pageLang = lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const branches = await getBranchesFromRealtimeDB();

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إدارة الفروع' : 'Branch Management',
    addBranch: effectiveLang === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch',
    noBranches: effectiveLang === 'ar' ? 'لا توجد فروع حاليًا.' : 'No branches found.',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <ClientAuthWrapperForBranchesPage lang={effectiveLang} addBranchText={t.addBranch} />
      </div>

      {branches.length > 0 ? (
        <BranchList branches={branches} lang={effectiveLang} />
      ) : (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mt-4">{t.noBranches}</p>
        </div>
      )}
    </div>
  );
}
