// src/providers/AuthProvider.tsx
"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth as mockFirebaseAuth } from "@/lib/firebase/client"; // Using mocked client auth
import { useRouter, usePathname } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  // login function will be handled by a server action + local state update
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Mock onAuthStateChanged
    const unsubscribe = mockFirebaseAuth.onAuthStateChanged((firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/reset-password");
      if (!user && !isAuthPage) {
        router.push("/login");
      } else if (user && isAuthPage) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);


  const logout = async () => {
    setLoading(true);
    // In a real app, call Firebase signOut
    // await signOut(mockFirebaseAuth);
    localStorage.removeItem('authUser'); // Mock logout
    setUser(null);
    setLoading(false);
    router.push('/login');
  };
  
  // This effect is to manually trigger re-check when local storage changes
  // (e.g. after login action updates it)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange); // For changes in other tabs
    // Custom event for same-tab changes, as 'storage' event doesn't fire for same tab.
    window.addEventListener('authChange', handleStorageChange); 
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);


  if (loading && !(pathname?.startsWith("/login") || pathname?.startsWith("/reset-password"))) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size={48} /></div>;
  }
  
  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
