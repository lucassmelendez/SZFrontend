'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

interface LoginModalContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  userType: 'cliente' | 'empleado';
  setUserType: (type: 'cliente' | 'empleado') => void;
  redirectBasedOnRole: (rol: number) => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userType, setUserType] = useState<'cliente' | 'empleado'>('cliente');
  const { user } = useAuth();
  const router = useRouter();

  // Cerrar el modal si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      setIsLoginModalOpen(false);
      
      // Si el usuario tiene un rol definido, redirigir según su rol
      if (user.id_rol !== undefined) {
        redirectBasedOnRole(user.id_rol);
      }
    }
  }, [user]);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  // Función para redirigir según el rol del usuario
  const redirectBasedOnRole = (rol: number) => {
    switch (rol) {
      case 1: // Administrador
        router.push('/admin/dashboard');
        break;
      case 2: // Empleado normal
        router.push('/empleado/dashboard');
        break;
      case 3: // Cliente (asumiendo que el rol 3 es para clientes)
      default:
        router.push('/perfil'); // Redirección por defecto para clientes
        break;
    }
  };

  return (
    <LoginModalContext.Provider value={{ 
      isLoginModalOpen, 
      openLoginModal, 
      closeLoginModal, 
      userType, 
      setUserType,
      redirectBasedOnRole
    }}>
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