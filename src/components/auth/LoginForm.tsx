'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';
import { useAuth } from '@/lib/auth/AuthContext';

interface LoginFormProps {
  onRegister: () => void;
  onSuccess: () => void;
}

export default function LoginForm({ onRegister, onSuccess }: LoginFormProps) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Realizar login
      await login(correo, contrasena);
      // Cerrar el modal después de iniciar sesión exitosamente
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
              placeholder="ejemplo@correo.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
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
        
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
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
      </form>
    </div>
  );
} 