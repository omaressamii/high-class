
import React from 'react'; // Import React
import type { User } from '@/types';
import { UserCard } from './UserCard';

interface UserListProps {
  users: User[];
  lang: string;
  onUserDeleted?: () => void;
}

const UserListComponent = ({ users, lang, onUserDeleted }: UserListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <UserCard key={user.id} user={user} lang={lang} onUserDeleted={onUserDeleted} />
      ))}
    </div>
  );
};

UserListComponent.displayName = 'UserList';
export const UserList = React.memo(UserListComponent);
