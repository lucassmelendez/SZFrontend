'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import PasswordChangeModal from './PasswordChangeModal';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PasswordChangeModalWrapper() {
  const { user, showPasswordChangeModal, setShowPasswordChangeModal, needsPasswordChange } = useAuth();
  const pathname = usePathname();

  // Efecto para detectar cambios de ruta y mostrar el modal si es necesario
  useEffect(() => {
    if (user && needsPasswordChange && !showPasswordChangeModal) {
      setShowPasswordChangeModal(true);
    }
  }, [pathname, user, needsPasswordChange, showPasswordChangeModal, setShowPasswordChangeModal]);

  // Evitar la navegación mientras se requiera cambio de contraseña
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (needsPasswordChange) {
        const message = 'Debes cambiar tu contraseña antes de continuar';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (needsPasswordChange) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [needsPasswordChange]);

  if (!user || !needsPasswordChange) {
    return null;
  }

  // Solo mostramos el modal para usuarios administradores (rol_id 2)
  const isAdmin = 'rol_id' in user && user.rol_id === 2;
  if (!isAdmin) {
    return null;
  }

  const handleClose = () => {
    setShowPasswordChangeModal(false);
    
    // Al cerrar el modal, marcamos en localStorage que ya se hizo el cambio
    localStorage.setItem('password_check_done', 'true');
    
    // Redirigir al dashboard de administración
    if (isAdmin) {
      window.location.href = '/admin/dashboard';
    }
  };

  return (
    <PasswordChangeModal
      isOpen={showPasswordChangeModal}
      onClose={handleClose}
      rut={user.rut}
    />
  );
} 