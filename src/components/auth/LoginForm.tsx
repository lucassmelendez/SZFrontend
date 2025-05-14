'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaSpinner, FaUserTie, FaUser } from 'react-icons/fa';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLoginModal } from '@/lib/auth/LoginModalContext';

interface LoginFormProps {
  onRegister: () => void;
  onSuccess: () => void;
}

export default function LoginForm({ onRegister, onSuccess }: LoginFormProps) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { userType, setUserType } = useLoginModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Verificar que userType sea válido, por defecto usamos 'cliente'
      const tipo = userType === 'empleado' ? 'empleado' : 'cliente';
      await login(correo, contrasena, tipo);
      onSuccess(); // Cerrar el modal después del login exitoso
      router.refresh(); // Forzar la actualización de la interfaz
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Iniciar Sesión</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Selector de tipo de usuario */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            type="button"
            onClick={() => setUserType('cliente')}
            className={`flex flex-col items-center p-3 rounded-lg border ${
              userType === 'cliente' 
                ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300' 
                : 'bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
            }`}
          >
            <FaUser className="text-2xl mb-1" />
            <span className="text-sm font-medium">Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => setUserType('empleado')}
            className={`flex flex-col items-center p-3 rounded-lg border ${
              userType === 'empleado' 
                ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300' 
                : 'bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
            }`}
          >
            <FaUserTie className="text-2xl mb-1" />
            <span className="text-sm font-medium">Empleado</span>
          </button>
        </div>

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
        
        {userType === 'cliente' && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿No tienes cuenta?{' '}
              <button 
                onClick={onRegister}
                className="text-blue-600 hover:text-blue-500 underline font-medium"
                type="button"
                data-testid="register-link"
              >
                Regístrate ahora
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
} 