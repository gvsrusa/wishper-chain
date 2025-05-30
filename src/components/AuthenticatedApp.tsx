import React from 'react';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  // Set up authenticated API within the auth context
  useAuthenticatedApi();
  
  return <>{children}</>;
}