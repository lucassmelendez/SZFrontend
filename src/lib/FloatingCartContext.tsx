'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFloatingCart } from './useFloatingCart';

interface FloatingCartContextType {
  isCartOpen: boolean;
  showCartAnimation: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const FloatingCartContext = createContext<FloatingCartContextType | undefined>(undefined);

export function FloatingCartProvider({ children }: { children: ReactNode }) {
  const floatingCartState = useFloatingCart();
  
  return (
    <FloatingCartContext.Provider value={floatingCartState}>
      {children}
    </FloatingCartContext.Provider>
  );
}

export function useFloatingCartContext() {
  const context = useContext(FloatingCartContext);
  
  if (context === undefined) {
    throw new Error('useFloatingCartContext debe ser usado dentro de un FloatingCartProvider');
  }
  
  return context;
} 