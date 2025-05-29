'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado, empleadoApiFast } from '@/lib/api';

interface CambiarContrasenaModalProps {
  onComplete?: () => void;
}

export default function CambiarContrasenaModal({ onComplete }: CambiarContrasenaModalProps) {
  const { user, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
      // Validaciones más simples
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // No permitir que la nueva contraseña sea igual al RUT
    if (user && isEmpleado(user) && user.rut) {
      const rutSinFormato = user.rut.replace(/[.-]/g, '');
      if (password === rutSinFormato) {
        setError('La nueva contraseña no puede ser igual a tu RUT');
        return;
      }
    }    try {
      setLoading(true);
      
      if (user && isEmpleado(user)) {
        // Usar el nuevo método específico para cambiar la contraseña
        console.log(`Cambiando contraseña para empleado ${user.id_empleado}`);
        
        // Llamar al método de la API para actualizar la contraseña
        const empleadoActualizado = await empleadoApiFast.cambiarContrasena(
          user.id_empleado,
          password
        );
        
        console.log('Respuesta de actualización de contraseña:', empleadoActualizado);
        
        // Actualizar estado del usuario en el contexto
        console.log('Cambiando primer_login a false');
        updateUser(empleadoActualizado);
        
        // También actualizar en localStorage directamente para mayor seguridad
        localStorage.setItem('empleado_data', JSON.stringify(empleadoActualizado));
        console.log('Actualizado empleado en localStorage con primer_login=false');
        
        setSuccess(true);
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1500);
      }      
      setLoading(false);
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      
      // Extraer mensaje de error más descriptivo si es posible
      let errorMessage = 'Error al cambiar la contraseña. Inténtelo de nuevo.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // @ts-ignore - Manejar posibles estructuras de error de la API
        errorMessage = err.detail || err.message || errorMessage;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Cambiar Contraseña</h2>
        
        {success ? (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-300 text-center">
            <div className="flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium">¡Contraseña cambiada exitosamente!</p>
            <p className="text-sm mt-1">Ya puedes acceder al sistema.</p>          </div>) : (
          <>
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 border-l-4 border-yellow-500">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-bold text-yellow-700 mb-1">Primer inicio de sesión detectado</h3>
                  <p className="text-gray-700">
                    Por razones de seguridad, es obligatorio cambiar tu contraseña temporal antes de continuar.
                    La contraseña inicial (basada en tu RUT) no es segura.
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nueva Contraseña</label>                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                  minLength={6}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Debe tener al menos 6 caracteres y no puede ser igual a tu RUT
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
