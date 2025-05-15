'use client';

import { ReactNode } from 'react';
import { FloatingCartProvider } from '@/lib/FloatingCartContext';

interface AppProviderProps {
  children: ReactNode;
}

export default function AppProvider({ children }: AppProviderProps) {
  return (
    <FloatingCartProvider>
      {children}
    </FloatingCartProvider>
  );
} 