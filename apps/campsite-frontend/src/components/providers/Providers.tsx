'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { WishlistProvider } from '@/contexts/WishlistContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <WishlistProvider>
        {children}
      </WishlistProvider>
    </AuthProvider>
  );
}
