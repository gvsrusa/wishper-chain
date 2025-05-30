// Hook to provide authenticated API access
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setAuthContext } from '../services/api-clerk';

export function useAuthenticatedApi() {
  const { user } = useAuth();

  useEffect(() => {
    // Set the auth context for the API
    setAuthContext(() => user?.id || null);
  }, [user]);

  // Return the API object if needed
  return null;
}