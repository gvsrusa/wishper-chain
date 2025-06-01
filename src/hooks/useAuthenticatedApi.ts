// Hook to provide authenticated API access
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { setAuthContext } from '../services/api-clerk';

export function useAuthenticatedApi() {
  const { user, isLoading } = useAuth();
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    // Set auth context with user ID directly
    console.log('useAuthenticatedApi - setting auth context, user:', user?.id, 'isLoading:', isLoading);
    setAuthContext(user?.id || null);
    
    // Mark as ready once auth has loaded (regardless of whether there's a user)
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsApiReady(true);
        console.log('API context ready with user:', user?.id || 'none');
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  // Return the ready state
  return { isApiReady };
}