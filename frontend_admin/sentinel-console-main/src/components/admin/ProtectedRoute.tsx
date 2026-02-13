import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, admin, isLoading } = useAdminAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Checking authentication');
  console.log('[ProtectedRoute] isLoading:', isLoading);
  console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated);
  console.log('[ProtectedRoute] admin:', admin);
  console.log('[ProtectedRoute] location:', location.pathname);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('[ProtectedRoute] Still loading auth state, showing loading screen');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] Authenticated, rendering children');
  return <>{children}</>;
}
