'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { FaLock, FaSpinner } from 'react-icons/fa';
import { authApi } from '@/lib/api';

export default function CambiarContrasenaModal() {
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (nuevaContrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      // Actualizar la contraseña
      await authApi.updateProfile({
        newPassword: nuevaContrasena
      });
      
      // Marcar como éxito y almacenar que ya no es primer inicio de sesión
      setSuccess(true);
      
      // Almacenamos en localStorage que ya no es primer inicio de sesión
      const empleadoData = localStorage.getItem('empleado_data');
      if (empleadoData) {
        const empleado = JSON.parse(empleadoData);
        empleado.primer_login = false;
        localStorage.setItem('empleado_data', JSON.stringify(empleado));
      }
      
      // Recargar la página después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Error al cambiar la contraseña');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Cambiar Contraseña</h2>
          <p className="text-gray-600 mt-2">
            Por ser tu primer inicio de sesión, es necesario que cambies tu contraseña antes de continuar.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-md text-center">
            <p className="font-medium">¡Contraseña actualizada con éxito!</p>
            <p className="mt-2">Redirigiendo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="nuevaContrasena" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="nuevaContrasena"
                  name="nuevaContrasena"
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmarContrasena" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  type="password"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
                  placeholder="••••••••"
                  required
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
                  Guardando cambios...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
