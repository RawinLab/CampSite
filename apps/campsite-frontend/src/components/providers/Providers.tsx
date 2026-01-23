'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthContextProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/contexts/WishlistContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthContextProvider>
      <AuthProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </AuthProvider>
    </AuthContextProvider>
  );
}
