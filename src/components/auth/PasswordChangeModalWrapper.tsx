'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import PasswordChangeModal from './PasswordChangeModal';

export default function PasswordChangeModalWrapper() {
  const { user, showPasswordChangeModal, setShowPasswordChangeModal, needsPasswordChange } = useAuth();

  if (!user || !needsPasswordChange) {
    return null;
  }

  // Verificar si es un empleado (cualquier rol de empleado)
  const isEmpleado = 'rol_id' in user && [2, 3, 4, 5].includes(user.rol_id);
  if (!isEmpleado) {
    return null;
  }

  const handleClose = () => {
    setShowPasswordChangeModal(false);
    
    // Al cerrar el modal, marcamos en localStorage que ya se hizo el cambio
    localStorage.setItem('password_check_done', 'true');
    
    // Redirigir al dashboard según el rol del empleado
    if ('rol_id' in user) {
      switch (user.rol_id) {
        case 2: // Administrador
          window.location.href = '/admin/dashboard';
          break;
        case 3: // Vendedor
          window.location.href = '/empleado/dashboard';
          break;
        case 4: // Bodeguero
          window.location.href = '/bodega/dashboard';
          break;
        case 5: // Contador
          window.location.href = '/contabilidad/dashboard';
          break;
        default:
          window.location.href = '/';
      }
    }
  };

  // Asegurarse de que user.rut no sea undefined
  if (!user.rut) {
    console.error('Error: RUT del usuario no disponible');
    return null;
  }

  return (
    <PasswordChangeModal
      isOpen={showPasswordChangeModal}
      onClose={handleClose}
      rut={user.rut}
    />
  );
} 