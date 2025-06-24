// src/providers/AuthProvider.tsx
"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for user session in localStorage on initial load
    try {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/reset-password");
      if (!user && !isAuthPage) {
        router.push("/login");
      }
    }
  }, [user, loading, pathname, router]);


  const logout = async () => {
    localStorage.removeItem('authUser');
    setUser(null);
    // Use replace to prevent user from going back to a protected page
    router.replace('/login');
  };
  
  // This effect listens for changes in localStorage from other tabs or from the login/logout flow
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          const freshUser = JSON.parse(storedUser);
          // Only update if the user object is different
          if (JSON.stringify(freshUser) !== JSON.stringify(user)) {
             setUser(freshUser);
          }
        } else if (user !== null) {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-tab changes (e.g., after login form submission)
    window.addEventListener('authChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, [user]);


  if (loading) {
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
