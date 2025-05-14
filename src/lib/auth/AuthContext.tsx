'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi, isCliente, isEmpleado } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  userType: 'cliente' | 'empleado' | null;
  login: (correo: string, contrasena: string, userType: 'cliente' | 'empleado') => Promise<void>;
  register: (correo: string, contrasena: string, nombre: string, apellido: string, telefono: string, direccion: string, rut: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<'cliente' | 'empleado' | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const savedUserType = localStorage.getItem('user_type');
        
        // Actualizar el tipo de usuario si existe en localStorage
        if (savedUserType === 'cliente' || savedUserType === 'empleado') {
          setUserType(savedUserType);
        }
        
        if (token) {
          // Si es un token de empleado generado localmente
          if (token.startsWith('empleado_session_')) {
            // Recuperar datos del empleado desde localStorage si existe
            const empleadoData = localStorage.getItem('empleado_data');
            if (empleadoData) {
              setUser(JSON.parse(empleadoData));
            }
          } else {
            // Es un token normal, obtener perfil del usuario
            const response = await authApi.getProfile();
            if (response.success) {
              setUser(response.data);
            } else {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_type');
            }
          }
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_type');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (correo: string, contrasena: string, userType: 'cliente' | 'empleado' = 'cliente') => {
    setIsLoading(true);
    try {
      if (userType === 'cliente') {
        // Intenta primero con la API normal
        try {
          const response = await authApi.login(correo, contrasena, 'cliente');
          if (response.success && response.data.user) {
            setUser(response.data.user);
            setUserType('cliente');
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user_type', 'cliente');
          }
        } catch (error) {
          // Si falla, intenta con FastAPI
          console.log('Intentando login con FastAPI para cliente');
          const response = await authApi.loginClienteFastAPI(correo, contrasena);
          if (response && response.cliente) {
            // Adaptar la respuesta a nuestro formato
            const clienteData = response.cliente;
            setUser(clienteData);
            setUserType('cliente');
            localStorage.setItem('auth_token', 'cliente_fastapi_' + Date.now());
            localStorage.setItem('user_type', 'cliente');
            localStorage.setItem('cliente_data', JSON.stringify(clienteData));
          } else {
            throw new Error('Error en el inicio de sesión con FastAPI');
          }
        }
      } else if (userType === 'empleado') {
        // Login de empleado con FastAPI
        const response = await authApi.loginEmpleadoFastAPI(correo, contrasena);
        if (response && response.empleado) {
          const empleadoData = response.empleado;
          setUser(empleadoData);
          setUserType('empleado');
          localStorage.setItem('auth_token', 'empleado_session_' + Date.now());
          localStorage.setItem('user_type', 'empleado');
          localStorage.setItem('empleado_data', JSON.stringify(empleadoData));
        } else {
          throw new Error('Error en el inicio de sesión de empleado');
        }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (correo: string, contrasena: string, nombre: string, apellido: string, telefono: string, direccion: string, rut: string) => {
    try {
      const response = await authApi.register(correo, contrasena, nombre, apellido, telefono, direccion, rut);
      if (response.success && response.data.user) {
        setUser(response.data.user);
        setUserType('cliente'); // Por defecto registramos como cliente
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_type', 'cliente');
      } else {
        throw new Error('Error en el registro');
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Intentar hacer logout en el servidor solo si no es sesión de empleado
      if (!localStorage.getItem('auth_token')?.startsWith('empleado_session_')) {
        await authApi.logout().catch(err => {
          console.warn('Error al comunicar logout al servidor:', err);
          // Continuar con el logout local aunque falle el servidor
        });
      }
      
      // Eliminar datos locales
      setUser(null);
      setUserType(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_type');
      localStorage.removeItem('cliente_data');
      localStorage.removeItem('empleado_data');
      
      // Redirigir a la página de inicio después de cerrar sesión
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, userType, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}