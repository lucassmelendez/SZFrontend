'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import PasswordChangeModal from './PasswordChangeModal';

export default function PasswordChangeModalWrapper() {
  const { user, showPasswordChangeModal, setShowPasswordChangeModal, needsPasswordChange } = useAuth();

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