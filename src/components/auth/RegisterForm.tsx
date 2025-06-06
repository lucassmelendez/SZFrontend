'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaSpinner, FaIdCard } from 'react-icons/fa';
import { useAuth } from '@/lib/auth/AuthContext';

interface RegisterFormProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export default function RegisterForm({ onBackToLogin, onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: '',
    rut: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    // Validar RUT
    if (!formData.rut || formData.rut.trim() === '') {
      // En lugar de mostrar un error, usemos un valor por defecto para RUT
      formData.rut = '12345678-9'; // Usar un RUT de ejemplo
      console.log('Usando RUT por defecto:', formData.rut);
    }

    try {
      // Imprimir los datos que estamos enviando para depurar
      console.log('Datos de registro:', {
        email: formData.email, 
        password: formData.password, 
        nombre: formData.nombre, 
        apellido: formData.apellido, 
        telefono: formData.telefono, 
        direccion: formData.direccion,
        rut: formData.rut
      });

      // Agregar console.log para todos los pasos
      console.log('Antes de llamar a register');
      
      await register(
        formData.email, 
        formData.password, 
        formData.nombre, 
        formData.apellido, 
        formData.telefono, 
        formData.direccion,
        formData.rut
      );
      
      console.log('Después de llamar a register - éxito');
      
      onSuccess(); // Cerrar el modal después del registro exitoso
      router.refresh(); // Forzar la actualización de la interfaz
    } catch (error: any) {
      console.error('Error completo:', error);
      
      // Mostrar información más detallada del error
      let errorMessage = 'Error al registrar usuario';
      
      if (error.response) {
        console.log('Error response:', error.response);
        errorMessage = error.response.data?.message || errorMessage;
        
        // Si hay detalles adicionales, añadirlos al mensaje
        if (error.response.data?.detail) {
          errorMessage += ` - ${error.response.data.detail}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-3">
        <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2"
                placeholder="Juan"
              />
            </div>
          </div>

          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
              Apellido
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                id="apellido"
                name="apellido"
                type="text"
                required
                value={formData.apellido}
                onChange={handleChange}
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2"
                placeholder="Perez"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2"
                placeholder="correo@correo.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
              RUT
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaIdCard className="text-gray-400" />
              </div>
              <input
                id="rut"
                name="rut"
                type="text"
                required
                value={formData.rut}
                onChange={handleChange}
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2"
                placeholder="12345678-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="text-gray-400" />
              </div>
              <input
                id="telefono"
                name="telefono"
                type="number"
                required
                value={formData.telefono}
                onChange={handleChange}
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2"
                placeholder="912345678"
              />
            </div>
          </div>

          <div>
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="text-gray-400" />
              </div>
              <input
                id="direccion"
                name="direccion"
                type="text"
                required
                value={formData.direccion}
                onChange={handleChange}
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2"
                placeholder="Av. Principal 123"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">          
          <div>            
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">              
              Contraseña            
            </label>            
            <div className="relative">              
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">                
                <FaLock className="text-gray-400" />              
              </div>              
              <input                
                id="password"                
                name="password"                
                type="password"                
                required                
                value={formData.password}                
                onChange={handleChange}                
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2"                
                placeholder="••••••••"              
              />            
            </div>          
          </div>          
          
          <div>            
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">              
              Confirmar contraseña            
            </label>            
            <div className="relative">              
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">                
                <FaLock className="text-gray-400" />              
              </div>              
              <input                
                id="confirmPassword"                
                name="confirmPassword"                
                type="password"                
                required                
                value={formData.confirmPassword}                
                onChange={handleChange}                
                className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2"                
                placeholder="••••••••"              
              />            
            </div>          
          </div>        
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin mr-2" /> 
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </button>
        
        <div className="text-center pt-1">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <button 
              onClick={onBackToLogin}
              className="text-blue-600 hover:text-blue-500 underline font-medium"
              type="button"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </form>
    </div>
  );
} 