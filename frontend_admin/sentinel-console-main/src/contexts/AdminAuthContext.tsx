import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { adminApiClient, ADMIN_API_ENDPOINTS } from "@/config/api";

interface AdminUser {
  username: string;
  adminId: string;
  token?: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface LoginResponse {
  token: string;
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    console.log('[AdminAuthContext] Initializing auth state');
    const stored = sessionStorage.getItem("adminSession");
    
    if (stored) {
      try {
        const adminData = JSON.parse(stored);
        console.log('[AdminAuthContext] Found stored session:', adminData);
        setAdmin(adminData);
      } catch (error) {
        console.error('[AdminAuthContext] Error parsing stored session:', error);
        sessionStorage.removeItem("adminSession");
      }
    } else {
      console.log('[AdminAuthContext] No stored session found');
    }
    
    // Mark loading as complete
    setTimeout(() => {
      setIsLoading(false);
      console.log('[AdminAuthContext] Auth initialization complete');
    }, 100);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('[AdminAuth] Starting login for:', username);
      
      // Demo credentials check - allows offline access
      if (username === "admin@sentinel.com" && password === "admin123") {
        console.log('[AdminAuth] Demo credentials detected');
        const adminData: AdminUser = {
          username: "admin@sentinel.com",
          adminId: "demo-admin",
          token: "demo-token-" + Date.now(),
        };

        console.log('[AdminAuth] Setting admin state:', adminData);
        setAdmin(adminData);
        sessionStorage.setItem("adminSession", JSON.stringify(adminData));
        console.log('[AdminAuth] Session saved to sessionStorage');
        
        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 150));
        console.log('[AdminAuth] Demo login successful');
        return true;
      }

      // Fall back to API authentication for other credentials
      console.log('[AdminAuth] Attempting API authentication');
      const response = await adminApiClient.post<LoginResponse>(
        ADMIN_API_ENDPOINTS.AUTH.LOGIN,
        { email: username, password }
      );

      console.log('[AdminAuth] API response received:', response.data);

      const adminData: AdminUser = {
        username: response.data.admin.email,
        adminId: response.data.admin.id,
        token: response.data.token,
      };

      console.log('[AdminAuth] Setting admin state:', adminData);
      setAdmin(adminData);
      sessionStorage.setItem("adminSession", JSON.stringify(adminData));
      
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 150));
      console.log('[AdminAuth] API login successful');
      return true;
    } catch (error: any) {
      console.error('[AdminAuth] Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApiClient.post(ADMIN_API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      setAdmin(null);
      sessionStorage.removeItem("adminSession");
    }
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
