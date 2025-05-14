'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface LoginModalContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user } = useAuth();

  // Cerrar el modal si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      setIsLoginModalOpen(false);
    }
  }, [user]);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <LoginModalContext.Provider value={{ isLoginModalOpen, openLoginModal, closeLoginModal }}>
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (context === undefined) {
    throw new Error('useLoginModal debe ser usado dentro de un LoginModalProvider');
  }
  return context;
} 