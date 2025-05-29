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

  return (
    <PasswordChangeModal
      isOpen={showPasswordChangeModal}
      onClose={() => {
        setShowPasswordChangeModal(false);
        // Al cerrar el modal, marcamos en localStorage que ya se hizo el cambio
        localStorage.setItem('password_check_done', 'true');
      }}
      rut={user.rut}
    />
  );
} 