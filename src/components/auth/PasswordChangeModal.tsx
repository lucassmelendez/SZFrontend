'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { FaKey } from 'react-icons/fa';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rut: string;
}

export default function PasswordChangeModal({ isOpen, onClose, rut }: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (newPassword === rut) {
      setError('La nueva contraseña no puede ser igual a tu RUT');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Enviamos la solicitud para actualizar la contraseña
      const updateData = {
        currentPassword: rut, // La contraseña actual es igual al RUT
        newPassword: newPassword,
        contrasena: newPassword // Para la API FastAPI
      };
      
      const response = await authApi.updateProfile(updateData);
      
      if (response.success) {
        toast.success('Contraseña actualizada exitosamente');
        
        // Actualizar el usuario en localStorage para reflejar los cambios
        if (response.data) {
          localStorage.setItem('empleado_data', JSON.stringify(response.data));
        }
        
        // Marcar que ya se realizó el cambio de contraseña
        localStorage.setItem('password_check_done', 'true');
        
        onClose();
        
        // Redirigir al dashboard de administrador
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 500); // Pequeño delay para que el toast sea visible
      } else {
        throw new Error(response.message || 'Error al actualizar la contraseña');
      }
    } catch (error: any) {
      console.error('Error al actualizar contraseña:', error);
      setError(error.response?.data?.message || error.response?.data?.detail || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} size="sm" closeable={false}>
      <div className="bg-gradient-to-br from-red-600 to-red-800 -mx-6 -mt-4 px-6 py-4 pt-8 rounded-t-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Cambio de Contraseña Requerido</h2>
          <p className="mt-2 text-red-100">
            Por seguridad, debes cambiar tu contraseña para continuar
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>¡Atención!</strong> Tu contraseña actual es igual a tu RUT. Por motivos de seguridad, debes cambiarla ahora para poder acceder al sistema. No podrás continuar hasta que completes este paso.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaKey className="text-gray-400" />
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaKey className="text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </Modal>
  );
} 