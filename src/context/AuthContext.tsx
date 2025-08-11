
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, UserPermissionsArray, PermissionString, Branch } from '@/types';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { ref, get, query, orderByChild, equalTo, onValue, off, DatabaseReference } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string) => Promise<{ success: boolean; error?: 'invalid_credentials' | 'account_deactivated' }>;
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
  const { toast } = useToast();

  // Cache for branch names to avoid repeated Firebase calls
  const branchNameCache = useMemo(() => new Map<string, string>(), []);

  // Ref to store the current user listener
  const userListenerRef = useRef<DatabaseReference | null>(null);

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

  const logout = useCallback(() => {
    // Clean up user listener if it exists
    if (userListenerRef.current) {
      off(userListenerRef.current);
      userListenerRef.current = null;
    }

    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push(`/${lang}`); // Redirect to the new splash page on logout
  }, [router, lang]);

  // Setup realtime listener for current user's status
  const setupUserStatusListener = useCallback((userId: string) => {
    // Clean up existing listener
    if (userListenerRef.current) {
      off(userListenerRef.current);
    }

    const userRef = ref(database, `users/${userId}`);
    userListenerRef.current = userRef;

    const listener = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = { id: userId, ...snapshot.val() } as User;

        // Check if user account is still active
        const isUserActive = userData.isActive !== false;

        if (!isUserActive) {
          // User account has been deactivated - force logout
          toast({
            title: lang === 'ar' ? 'تم تعطيل حسابك' : 'Account Deactivated',
            description: lang === 'ar' ? 'تم تعطيل حسابك من قبل الإدارة. سيتم تسجيل خروجك الآن.' : 'Your account has been deactivated by administration. You will be logged out now.',
            variant: "destructive",
            duration: 5000,
          });

          // Force logout after a short delay to allow user to see the message
          setTimeout(() => {
            logout();
          }, 2000);
        } else {
          // Update user session with latest data
          updateUserSession(userData);
        }
      } else {
        // User has been deleted - force logout
        toast({
          title: lang === 'ar' ? 'تم حذف حسابك' : 'Account Deleted',
          description: lang === 'ar' ? 'تم حذف حسابك من النظام. سيتم تسجيل خروجك الآن.' : 'Your account has been deleted from the system. You will be logged out now.',
          variant: "destructive",
          duration: 5000,
        });

        setTimeout(() => {
          logout();
        }, 2000);
      }
    }, (error) => {
      console.error("Error listening to user status changes:", error);
    });

    return listener;
  }, [lang, toast, logout, updateUserSession]);


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

                // Check if user is still active
                const isUserActive = userDataFromDb.isActive !== false;
                if (!isUserActive) {
                  // User has been deactivated - don't restore session
                  localStorage.removeItem('currentUser');
                  setCurrentUser(null);
                  setIsLoading(false);
                  return;
                }

                await updateUserSession(userDataFromDb);
                // Setup realtime listener for user status changes
                setupUserStatusListener(storedUser.id);
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
  }, [updateUserSession, setupUserStatusListener]);

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


  const login = async (usernameInput: string, passwordAttempt: string): Promise<{ success: boolean; error?: 'invalid_credentials' | 'account_deactivated' }> => {
    setIsLoading(true);
    try {
      const usersRef = ref(database, "users");
      const usersQuery = query(usersRef, orderByChild("username"), equalTo(usernameInput));
      const querySnapshot = await get(usersQuery);

      if (!querySnapshot.exists()) {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        setIsLoading(false);
        return { success: false, error: 'invalid_credentials' };
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
        return { success: false, error: 'invalid_credentials' };
      }

      // TypeScript assertion: foundUser is guaranteed to be User at this point
      const user = foundUser as User;
      const usernameMatch = user.username === usernameInput;
      const passwordMatch = user.password === passwordAttempt;

      if (usernameMatch && passwordMatch) {
        // Check if user account is active (defaults to true if not set)
        const isUserActive = user.isActive !== false;

        if (!isUserActive) {
          // User account is deactivated
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
          setIsLoading(false);
          return { success: false, error: 'account_deactivated' };
        }

        await updateUserSession(user);
        // Setup realtime listener for user status changes
        setupUserStatusListener(foundUserId!);
        router.push(`/${lang}/dashboard`); // Redirect to the new dashboard on successful login
        setIsLoading(false);
        return { success: true };
      } else {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        setIsLoading(false);
        return { success: false, error: 'invalid_credentials' };
      }

    } catch (error) {
      console.error("AuthContext LOGIN - Error during login:", error);
      if (error && typeof error === 'object' && 'code' in error) {
        console.error("Database Error Code:", (error as any).code);
        console.error("Database Error Message:", (error as any).message);
      }
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      setIsLoading(false);
      return { success: false, error: 'invalid_credentials' };
    }
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

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      if (userListenerRef.current) {
        off(userListenerRef.current);
        userListenerRef.current = null;
      }
    };
  }, []);

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
