
import React from 'react'; // Import React
import type { Branch } from '@/types';
import { BranchCard } from './BranchCard';

interface BranchListProps {
  branches: Branch[];
  lang: string;
}

const BranchListComponent = ({ branches, lang }: BranchListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {branches.map((branch) => (
        <BranchCard key={branch.id} branch={branch} lang={lang} />
      ))}
    </div>
  );
};

BranchListComponent.displayName = 'BranchList';
export const BranchList = React.memo(BranchListComponent);
