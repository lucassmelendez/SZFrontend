'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';
import { useAuth } from '@/lib/auth/AuthContext';
import Modal from '@/components/ui/Modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(correo, contrasena);
      onClose(); // Cerrar el modal después del login exitoso
      router.refresh(); // Forzar la actualización de la interfaz
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 -mx-6 -mt-4 px-6 py-6 rounded-t-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Bienvenido a SpinZone</h2>
          <p className="mt-2 text-blue-100">
            Inicia sesión para acceder a tu cuenta
          </p>
        </div>
      </div>

      <div className="px-2 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white py-2.5"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                autoComplete="current-password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white py-2.5"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> 
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link 
              href="/auth/register" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={onClose}
            >
              Regístrate ahora
            </Link>
          </p>
        </div>
      </div>
    </Modal>
  );
} 