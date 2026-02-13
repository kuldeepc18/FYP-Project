import { ReactNode, useEffect, useState } from 'react';
import { TopNav } from './TopNav';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authService } from '@/services/auth';
import { setAuth } from '@/store/authSlice';
import { websocketService } from '@/services';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    console.log('[Layout] Checking authentication...');
    
    // Check auth on mount
    const authState = authService.getAuthState();
    console.log('[Layout] Auth state from storage:', authState ? 'Found' : 'Not found');
    
    if (authState) {
      console.log('[Layout] Setting auth state in Redux');
      dispatch(setAuth(authState));
      
      // Connect WebSocket
      if (!websocketService.isConnected()) {
        console.log('[Layout] Connecting WebSocket');
        websocketService.connect();
      }
      
      // Mark auth as checked after a small delay to ensure Redux updates
      setTimeout(() => {
        console.log('[Layout] Auth check complete - authenticated');
        setIsAuthChecked(true);
      }, 50);
    } else {
      console.log('[Layout] No auth state found, redirecting to login');
      setIsAuthChecked(true);
      navigate('/auth/login', { replace: true });
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    // Apply theme on mount
    const theme = localStorage.getItem('ktrade_theme') || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Show loading state while checking authentication
  if (!isAuthChecked) {
    console.log('[Layout] Waiting for auth check...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth checked but not authenticated, return null (redirect will happen)
  if (!isAuthenticated) {
    console.log('[Layout] Not authenticated after check');
    return null;
  }

  console.log('[Layout] Rendering authenticated layout');
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="w-full">{children}</main>
    </div>
  );
};
