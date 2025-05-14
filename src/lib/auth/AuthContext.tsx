'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (correo: string, contrasena: string, nombre: string, apellido: string, telefono: string, direccion: string, rut: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await authApi.getProfile();
          if (response.success) {
            setUser(response.data);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (correo: string, contrasena: string) => {
    try {
      const response = await authApi.login(correo, contrasena);
      if (response.success && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('auth_token', response.data.token);
      } else {
        throw new Error('Error en el inicio de sesión');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };

  const register = async (correo: string, contrasena: string, nombre: string, apellido: string, telefono: string, direccion: string, rut: string) => {
    try {
      const response = await authApi.register(correo, contrasena, nombre, apellido, telefono, direccion, rut);
      if (response.success && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('auth_token', response.data.token);
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
      // Intentar hacer logout en el servidor
      await authApi.logout().catch(err => {
        console.warn('Error al comunicar logout al servidor:', err);
        // Continuar con el logout local aunque falle el servidor
      });
      
      // Eliminar datos locales
      setUser(null);
      localStorage.removeItem('auth_token');
      
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
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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