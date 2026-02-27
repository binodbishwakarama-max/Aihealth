'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // If Clerk is not configured, render children without ClerkProvider
  if (!clerkKey || clerkKey.startsWith('pk_test_placeholder')) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}
