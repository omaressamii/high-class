
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { User, UserPermissionsArray, PermissionString, Branch } from '@/types';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  permissions: UserPermissionsArray | null;
  hasPermission: (permission: PermissionString) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string || 'ar';
  const pathname = usePathname(); 

  // Cache for branch names to avoid repeated Firebase calls
  const branchNameCache = useMemo(() => new Map<string, string>(), []);

  const updateUserSession = useCallback(async (userData: User) => {
    let effectiveUser = { ...userData };

    // Only fetch branch name if needed and not cached
    if (effectiveUser.branchId && !effectiveUser.branchName && !effectiveUser.permissions.includes('view_all_branches')) {
      // Check cache first
      const cachedBranchName = branchNameCache.get(effectiveUser.branchId);
      if (cachedBranchName) {
        effectiveUser.branchName = cachedBranchName;
      } else {
        try {
          const branchRef = ref(database, `branches/${effectiveUser.branchId}`);
          const branchSnap = await get(branchRef);
          if (branchSnap.exists()) {
            const branchName = branchSnap.val()?.name;
            effectiveUser.branchName = branchName;
            // Cache the result
            branchNameCache.set(effectiveUser.branchId, branchName);
          }
        } catch (e) {
          console.error("AuthContext - Error fetching branch name during session update:", e);
        }
      }
    }

    setCurrentUser(effectiveUser);
    localStorage.setItem('currentUser', JSON.stringify({
        id: effectiveUser.id,
        username: effectiveUser.username,
        branchId: effectiveUser.branchId,
        branchName: effectiveUser.branchName
    }));
  }, [branchNameCache]);


  useEffect(() => {
    setIsLoading(true);
    const storedUserString = localStorage.getItem('currentUser');

    if (storedUserString) {
      try {
        const storedUser: { id: string; username: string; branchId?: string; branchName?: string; } = JSON.parse(storedUserString);
        if (storedUser && storedUser.id) {
          const userRef = ref(database, `users/${storedUser.id}`);
          get(userRef)
            .then(async snapshot => {
              if (snapshot.exists()) {
                const userDataFromDb = { id: storedUser.id, ...snapshot.val() } as User;
                await updateUserSession(userDataFromDb);
              } else {
                localStorage.removeItem('currentUser');
                setCurrentUser(null);
              }
            })
            .catch(error => {
              console.error("AuthContext (Initial Load) - Error fetching user from Realtime Database:", error);
              localStorage.removeItem('currentUser');
              setCurrentUser(null);
            })
            .finally(() => {
              setIsLoading(false);
            });
        } else {
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("AuthContext (Initial Load) - Error parsing stored user from localStorage:", error);
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setIsLoading(false);
      }
    } else {
      setCurrentUser(null);
      setIsLoading(false); 
    }
  }, []); 

  useEffect(() => {
    if (!isLoading && !currentUser) {
      // Public paths: splash page (`/[lang]`) and login page (`/[lang]/login`)
      const isPublicPath = pathname === `/${lang}` || pathname === `/${lang}/login`;
      if (!isPublicPath) {
        // console.log(`AuthContext: Not logged in and on a protected page (${pathname}). Redirecting to /${lang}/login.`);
        router.push(`/${lang}/login`);
      }
    }
  }, [isLoading, currentUser, pathname, lang, router]);


  const login = async (usernameInput: string, passwordAttempt: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const usersRef = ref(database, "users");
      const usersQuery = query(usersRef, orderByChild("username"), equalTo(usernameInput));
      const querySnapshot = await get(usersQuery);

      if (!querySnapshot.exists()) {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        setIsLoading(false);
        return false;
      }

      // Find user with matching username (removed isSeller restriction)
      let foundUser: User | null = null;
      let foundUserId: string | null = null;

      querySnapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.username === usernameInput) {
          foundUser = { id: childSnapshot.key!, ...userData } as User;
          foundUserId = childSnapshot.key!;
        }
      });

      if (!foundUser) {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        setIsLoading(false);
        return false;
      }

      // TypeScript assertion: foundUser is guaranteed to be User at this point
      const user = foundUser as User;
      const usernameMatch = user.username === usernameInput;
      const passwordMatch = user.password === passwordAttempt;

      if (usernameMatch && passwordMatch) {
        await updateUserSession(user);
        router.push(`/${lang}/dashboard`); // Redirect to the new dashboard on successful login
      } else {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
      }
      setIsLoading(false);
      return usernameMatch && passwordMatch;

    } catch (error) {
      console.error("AuthContext LOGIN - Error during login:", error);
      if (error && typeof error === 'object' && 'code' in error) {
        console.error("Database Error Code:", (error as any).code);
        console.error("Database Error Message:", (error as any).message);
      }
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push(`/${lang}`); // Redirect to the new splash page on logout
  };

  const permissions = currentUser ? currentUser.permissions : null;

  // Memoize permissions for better performance
  const memoizedPermissions = useMemo(() => permissions, [permissions]);

  const hasPermission = useCallback((permissionToCheck: PermissionString): boolean => {
    if (isLoading || !currentUser || !memoizedPermissions) {
      return false;
    }
    return memoizedPermissions.includes(permissionToCheck);
  }, [isLoading, currentUser, memoizedPermissions]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentUser,
    login,
    logout,
    isLoading,
    permissions,
    hasPermission
  }), [currentUser, login, logout, isLoading, permissions, hasPermission]);

  if (isLoading) {
    const isPublicPage = pathname === `/${lang}` || pathname === `/${lang}/login`;
    if (isPublicPage) {
        return (
            <AuthContext.Provider value={contextValue}>
                {children}
            </AuthContext.Provider>
        );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-body)' }}>
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>{lang === 'ar' ? 'جار تحميل التطبيق...' : 'Loading application...'}</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
