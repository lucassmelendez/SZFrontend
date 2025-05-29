'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi, isCliente, isEmpleado } from '@/lib/api';
import { apiFast } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  userType: 'cliente' | 'empleado' | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (correo: string, contrasena: string, nombre: string, apellido: string, telefono: string, direccion: string, rut: string) => Promise<void>;
  logout: () => Promise<void>;
  showPasswordChangeModal: boolean;
  setShowPasswordChangeModal: (show: boolean) => void;
  needsPasswordChange: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<'cliente' | 'empleado' | null>(null);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const savedUserType = localStorage.getItem('user_type');
        const savedUserData = localStorage.getItem('cliente_data') || localStorage.getItem('empleado_data');
        
        // Si tenemos datos guardados, intentar restaurar la sesión
        if (token && savedUserType && savedUserData) {
          try {
            // Restaurar el tipo de usuario
            setUserType(savedUserType as 'cliente' | 'empleado');
            
            // Restaurar los datos del usuario
            const userData = JSON.parse(savedUserData);
            setUser(userData);
            
            // Verificar si cualquier empleado tiene contraseña igual al RUT
            if (isEmpleado(userData)) {
              // Verificar si tiene datos en localStorage sobre necesidad de cambio
              const passwordCheckDone = localStorage.getItem('password_check_done');
              if (!passwordCheckDone) {
                try {
                  // Verificar con el servidor si la contraseña es igual al RUT
                  const checkResponse = await authApi.checkPasswordEqualsRut();
                  if (checkResponse.needsChange) {
                    setNeedsPasswordChange(true);
                    setShowPasswordChangeModal(true);
                  } else {
                    // Marcar que el chequeo ya se realizó
                    localStorage.setItem('password_check_done', 'true');
                  }
                } catch (error) {
                  console.error('Error al verificar si la contraseña es igual al RUT:', error);
                  // Si no podemos verificar, asumimos que no necesita cambio
                  localStorage.setItem('password_check_done', 'true');
                }
              }
            }
            
            // Si es un token de sesión normal (no interno), verificar con el servidor
            if (!token.startsWith('empleado_session_') && !token.startsWith('cliente_fastapi_')) {
              try {
                const response = await authApi.getProfile();
                if (response.success) {
                  // Actualizar con los datos más recientes del servidor
                  setUser(response.data);
                  // Actualizar datos en localStorage
                  localStorage.setItem('cliente_data', JSON.stringify(response.data));
                } else {
                  // Si la verificación falla, limpiar la sesión
                  throw new Error('Sesión inválida');
                }
              } catch (error) {
                console.error('Error al verificar sesión con el servidor:', error);
                throw error;
              }
            }
          } catch (error) {
            console.error('Error al restaurar sesión:', error);
            // Limpiar datos inválidos
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_type');
            localStorage.removeItem('cliente_data');
            localStorage.removeItem('empleado_data');
            localStorage.removeItem('password_check_done');
            setUser(null);
            setUserType(null);
            setNeedsPasswordChange(false);
          }
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        // Limpiar datos en caso de error
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('cliente_data');
        localStorage.removeItem('empleado_data');
        localStorage.removeItem('password_check_done');
        setUser(null);
        setUserType(null);
        setNeedsPasswordChange(false);
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
      // Intentar primero con FastAPI para clientes
      try {
        const clienteResponse = await authApi.loginClienteFastAPI(correo, contrasena);
        if (clienteResponse && clienteResponse.cliente) {
          // Adaptar la respuesta a nuestro formato
          const clienteData = clienteResponse.cliente;
          setUser(clienteData);
          setUserType('cliente');
          localStorage.setItem('auth_token', clienteResponse.token || 'cliente_fastapi_' + Date.now());
          localStorage.setItem('user_type', 'cliente');
          localStorage.setItem('cliente_data', JSON.stringify(clienteData));
          redirectUserBasedOnRole(clienteData);
          return; // Salir si el login fue exitoso
        }
      } catch (error) {
        console.log('Login de cliente con FastAPI falló, intentando login de empleado');
      }
      
      // Si falla el primer intento, probar login de empleado
      try {
        const empleadoResponse = await authApi.loginEmpleadoFastAPI(correo, contrasena);
        if (empleadoResponse && empleadoResponse.empleado) {
          const empleadoData = empleadoResponse.empleado;
          setUser(empleadoData);
          setUserType('empleado');
          localStorage.setItem('auth_token', empleadoResponse.token || 'empleado_session_' + Date.now());
          localStorage.setItem('user_type', 'empleado');
          localStorage.setItem('empleado_data', JSON.stringify(empleadoData));
          
          // Verificar si es un administrador (rol_id 2) con contraseña igual al RUT
          if (empleadoData.rol_id === 2 || empleadoData.rol_id === 3 || empleadoData.rol_id === 4 || empleadoData.rol_id === 5) {
            try {
              // Limpiar marca de verificación previa
              localStorage.removeItem('password_check_done');
              
              // Si la contraseña usada para iniciar sesión es igual al RUT
              if (contrasena === empleadoData.rut) {
                setNeedsPasswordChange(true);
                setShowPasswordChangeModal(true);
                // No redirigir al dashboard hasta que cambie la contraseña
                return; // Importante: no continuamos con la redirección
              } else {
                // Marcar que el chequeo ya se realizó
                localStorage.setItem('password_check_done', 'true');
              }
            } catch (error) {
              console.error('Error al verificar si la contraseña es igual al RUT:', error);
              // Si no podemos verificar, asumimos que no necesita cambio
              localStorage.setItem('password_check_done', 'true');
            }
          }
          
          redirectUserBasedOnRole(empleadoData);
          return; // Salir si el login fue exitoso
        }
      } catch (error) {
        console.error('Login de empleado falló');
        throw new Error('Credenciales inválidas');
      }
      
      // Si ninguna de las anteriores funcionó, intentar con la API normal
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
        console.log('Login con API normal falló también');
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
      // Intentar primero con FastAPI
      try {
        const response = await authApi.registerFastAPI(correo, contrasena, nombre, apellido, telefono, direccion, rut);
        if (response && response.cliente) {
          setUser(response.cliente);
          setUserType('cliente');
          localStorage.setItem('auth_token', response.token || 'cliente_fastapi_' + Date.now());
          localStorage.setItem('user_type', 'cliente');
          localStorage.setItem('cliente_data', JSON.stringify(response.cliente));
          redirectUserBasedOnRole(response.cliente);
          return;
        }
      } catch (error) {
        console.error('Error en registro con FastAPI, intentando con API normal:', error);
      }

      // Si falla, intentar con la API normal
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
      // Intentar hacer logout en el servidor solo si no es sesión interna
      const authToken = localStorage.getItem('auth_token');
      if (authToken && !authToken.startsWith('empleado_session_') && !authToken.startsWith('cliente_fastapi_')) {
        try {
          // Logout en la API normal
          await authApi.logout().catch((err: Error) => {
            console.warn('Error al comunicar logout al servidor:', err);
          });
        } catch (error) {
          console.warn('Error durante el logout en la API normal:', error);
        }
      } else if (authToken && authToken.startsWith('cliente_fastapi_')) {
        try {
          // Intenta hacer logout en FastAPI para clientes
          await apiFast.post('/clientes/logout').catch((err: Error) => {
            console.warn('Error al comunicar logout de cliente a FastAPI:', err);
          });
        } catch (error) {
          console.warn('Error durante el logout de cliente en FastAPI:', error);
        }
      } else if (authToken && authToken.startsWith('empleado_session_')) {
        try {
          // Intenta hacer logout en FastAPI para empleados
          await apiFast.post('/empleados/logout').catch((err: Error) => {
            console.warn('Error al comunicar logout de empleado a FastAPI:', err);
          });
        } catch (error) {
          console.warn('Error durante el logout de empleado en FastAPI:', error);
        }
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
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        userType,
        login,
        register,
        logout,
        showPasswordChangeModal,
        setShowPasswordChangeModal,
        needsPasswordChange
      }}
    >
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