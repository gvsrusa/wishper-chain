import React, { createContext, useContext } from 'react';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

interface ApiContextType {
  isApiReady: boolean;
}

const ApiContext = createContext<ApiContextType>({ isApiReady: false });

export const useApiReady = () => useContext(ApiContext);

export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  // Set up authenticated API within the auth context
  const { isApiReady } = useAuthenticatedApi();
  
  return (
    <ApiContext.Provider value={{ isApiReady }}>
      {children}
    </ApiContext.Provider>
  );
}