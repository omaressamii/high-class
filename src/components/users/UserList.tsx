
import React from 'react'; // Import React
import type { User, FinancialTransaction } from '@/types';
import { UserCard } from './UserCard';

interface UserListProps {
  users: User[];
  lang: string;
  transactions?: FinancialTransaction[];
  currentUser?: User;
  onUserDeleted?: () => void;
  onCashoutComplete?: () => void;
}

const UserListComponent = ({
  users,
  lang,
  transactions = [],
  currentUser,
  onUserDeleted,
  onCashoutComplete
}: UserListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          lang={lang}
          transactions={transactions}
          currentUser={currentUser}
          onUserDeleted={onUserDeleted}
          onCashoutComplete={onCashoutComplete}
        />
      ))}
    </div>
  );
};

UserListComponent.displayName = 'UserList';
export const UserList = React.memo(UserListComponent);
