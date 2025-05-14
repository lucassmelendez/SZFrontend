'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';
import { isCliente, isEmpleado } from '@/lib/api';

interface LoginModalContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  redirectBasedOnUserType: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

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

  // Función para redirigir según el tipo de usuario (cliente o empleado) y su rol
  const redirectBasedOnUserType = () => {
    if (!user) return;

    if (isCliente(user)) {
      // Es un cliente (rol 1) - No redirigimos, se queda en la misma página
      return; // Eliminamos la redirección
    } else if (isEmpleado(user)) {
      // Según el rol del empleado
      switch (user.rol_id) {
        case 2: // Administrador
          router.push('/admin/dashboard');
          break;
        case 3: // Vendedor
          router.push('/empleado/dashboard');
          break;
        case 4: // Bodeguero
          router.push('/bodega/dashboard');
          break;
        case 5: // Contador
          router.push('/contabilidad/dashboard');
          break;
        default:
          // En caso de otro rol no especificado, ir a la página principal
          router.push('/');
      }
    } else {
      // Si no se puede determinar el tipo, ir a la página principal
      router.push('/');
    }
  };

  return (
    <LoginModalContext.Provider value={{ 
      isLoginModalOpen, 
      openLoginModal, 
      closeLoginModal,
      redirectBasedOnUserType
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