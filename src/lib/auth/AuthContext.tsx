'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi, isCliente, isEmpleado } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  userType: 'cliente' | 'empleado' | null;
  login: (correo: string, contrasena: string) => Promise<void>;
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

  // Función auxiliar para redirigir al usuario según su rol
  const redirectUserBasedOnRole = (userObj: User) => {
    if (typeof window === 'undefined') return;
    
    if (isCliente(userObj)) {
      // Es un cliente (rol 1) - No redirigimos, se queda en la misma página
      return; // Eliminamos la redirección
    } else if (isEmpleado(userObj)) {
      // Según el rol del empleado
      switch (userObj.rol_id) {
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
          // En caso de otro rol no especificado, ir a la página principal
          window.location.href = '/';
      }
    }
  };

  const login = async (correo: string, contrasena: string) => {
    setIsLoading(true);
    try {
      // Intentar primero en la API normal (para clientes)
      try {
        const response = await authApi.login(correo, contrasena, 'cliente');
        if (response.success && response.data.user) {
          setUser(response.data.user);
          setUserType('cliente');
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('user_type', 'cliente');
          redirectUserBasedOnRole(response.data.user);
          return; // Salir si el login fue exitoso
        }
      } catch (error) {
        console.log('Login con API normal falló, intentando FastAPI');
      }
      
      // Si falla el primer intento, probar con FastAPI para clientes
      try {
        const clienteResponse = await authApi.loginClienteFastAPI(correo, contrasena);
        if (clienteResponse && clienteResponse.cliente) {
          // Adaptar la respuesta a nuestro formato
          const clienteData = clienteResponse.cliente;
          setUser(clienteData);
          setUserType('cliente');
          localStorage.setItem('auth_token', 'cliente_fastapi_' + Date.now());
          localStorage.setItem('user_type', 'cliente');
          localStorage.setItem('cliente_data', JSON.stringify(clienteData));
          redirectUserBasedOnRole(clienteData);
          return; // Salir si el login fue exitoso
        }
      } catch (error) {
        console.log('Login de cliente con FastAPI falló, intentando login de empleado');
      }
      
      // Finalmente, probar login de empleado
      try {
        const empleadoResponse = await authApi.loginEmpleadoFastAPI(correo, contrasena);
        if (empleadoResponse && empleadoResponse.empleado) {
          const empleadoData = empleadoResponse.empleado;
          setUser(empleadoData);
          setUserType('empleado');
          localStorage.setItem('auth_token', 'empleado_session_' + Date.now());
          localStorage.setItem('user_type', 'empleado');
          localStorage.setItem('empleado_data', JSON.stringify(empleadoData));
          redirectUserBasedOnRole(empleadoData);
          return; // Salir si el login fue exitoso
        }
      } catch (error) {
        console.error('Login de empleado falló');
        throw new Error('Credenciales inválidas');
      }
      
      // Si llegamos aquí es porque ningún método de login funcionó
      throw new Error('No se pudo autenticar con las credenciales proporcionadas');
      
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
        redirectUserBasedOnRole(response.data.user);
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