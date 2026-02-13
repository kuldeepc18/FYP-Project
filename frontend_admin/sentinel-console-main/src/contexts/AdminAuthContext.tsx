import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { adminApiClient, ADMIN_API_ENDPOINTS } from "@/config/api";

interface AdminUser {
  username: string;
  adminId: string;
  token?: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface LoginResponse {
  token: string;
  user: {
    email: string;
    name: string;
  };
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = sessionStorage.getItem("adminSession");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      // Demo credentials check - allows offline access
      if (username === "admin@sentinel.com" && password === "admin123") {
        const adminData: AdminUser = {
          username: "admin@sentinel.com",
          adminId: "demo-admin",
          token: "demo-token-" + Date.now(),
        };

        setAdmin(adminData);
        sessionStorage.setItem("adminSession", JSON.stringify(adminData));
        return true;
      }

      // Fall back to API authentication for other credentials
      const response = await adminApiClient.post<LoginResponse>(
        ADMIN_API_ENDPOINTS.AUTH.LOGIN,
        { email: username, password }
      );

      const adminData: AdminUser = {
        username: response.data.user?.email || username,
        adminId: response.data.user?.email || username,
        token: response.data.token,
      };

      setAdmin(adminData);
      sessionStorage.setItem("adminSession", JSON.stringify(adminData));
      return true;
    } catch (error: any) {
      console.error('Admin login error:', error);
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
