"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";

// Check if Clerk is properly configured with a valid publishable key
function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Must exist and start with pk_test_ or pk_live_
  if (!key) return false;
  if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) return false;
  
  // Must not be a placeholder
  if (key === 'YOUR_PUBLISHABLE_KEY') return false;
  if (key.includes('placeholder')) return false;
  
  // Must have actual content after the prefix (real keys are 50+ chars)
  if (key.length < 30) return false;
  
  return true;
}

// Dynamically import ClerkProvider only when configured
const ClerkProviderWrapper = dynamic(
  () => import("@clerk/nextjs").then((mod) => {
    const { ClerkProvider } = mod;
    return function ClerkWrapper({ children }: { children: ReactNode }) {
      return <ClerkProvider>{children}</ClerkProvider>;
    };
  }),
  { 
    ssr: true,
    loading: () => null,
  }
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // If Clerk is not configured, render children directly
  if (!isClerkConfigured()) {
    return <>{children}</>;
  }

  // Clerk is configured, use ClerkProvider
  return <ClerkProviderWrapper>{children}</ClerkProviderWrapper>;
}
