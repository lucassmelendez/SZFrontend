import axios from 'axios';

const isClient = typeof window !== 'undefined';

const API_URL = 'https://sz-backend.vercel.app/api';
// API FastAPI - actualizada a la versión desplegada en Vercel
const API_FASTAPI_URL = 'https://szfast-api.vercel.app';
//const API_URL = 'http://localhost:3000/api';

console.log('API URL:', API_URL);

// Crear una instancia de axios con la URL base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Configurar CORS en Axios
  withCredentials: false,
});

// Instancia para FastAPI
export const apiFast = axios.create({
  baseURL: API_FASTAPI_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use((config) => {
  if (isClient) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para agregar el token a las peticiones de apiFast
apiFast.interceptors.request.use((config) => {
  if (isClient) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para manejar respuestas y errores
apiFast.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Manejar error de autenticación 
      console.error('Error de autenticación en la API FastAPI');
      // Aquí podrías implementar un redirect al login o un refresh del token
    }
    if (error.message === 'Network Error') {
      console.error('Error de conexión con la API FastAPI. Posible problema de CORS.');
    }
    return Promise.reject(error);
  }
);

// Interfaces para los datos
export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  marca: string;
  peso: string;
  stock: number;
  categoria_id: number;
}

// Interfaz base para usuarios
export interface UserBase {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | number;
  direccion: string;
  rut?: string;
  contrasena?: string;
}

// Interfaz para clientes
export interface Cliente extends UserBase {
  id_cliente: number;
  id_rol: number;
}

// Interfaz para empleados
export interface Empleado extends UserBase {
  id_empleado: number;
  rol_id: number;
}

// Tipo unión para representar cualquier tipo de usuario
export type User = Cliente | Empleado;

// Helper para determinar el tipo de usuario
export const isCliente = (user: User): user is Cliente => {
  return 'id_cliente' in user;
};

export const isEmpleado = (user: User): user is Empleado => {
  return 'id_empleado' in user;
};

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API de productos
export const productoApi = {
  getAll: async (): Promise<Producto[]> => {
    const response = await api.get<ApiResponse<Producto[]>>('/productos');
    return response.data.data;
  },
  
  getById: async (id: number): Promise<Producto> => {
    const response = await api.get<ApiResponse<Producto>>(`/productos/${id}`);
    return response.data.data;
  },
  
  search: async (term: string): Promise<Producto[]> => {
    const response = await api.get<ApiResponse<Producto[]>>(`/productos/search?term=${term}`);
    return response.data.data;
  },
  
  getByCategoria: async (categoriaId: number): Promise<Producto[]> => {
    const response = await api.get<ApiResponse<Producto[]>>(`/productos/categoria/${categoriaId}`);
    return response.data.data;
  },
  updateStock: async (id: number, stock: number): Promise<Producto> => {
    try {
      // Usar la API correcta y endpoint correcto
      const response = await api.patch(`/productos/${id}`, { stock });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al actualizar stock');
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error al actualizar stock del producto ${id}:`, error);
      throw error;
    }
  },
};

// API de autenticación
export const authApi = {
  // Login normal (para clientes, usando la API actual)
  login: async (correo: string, contrasena: string, userType?: 'cliente' | 'empleado'): Promise<LoginResponse> => {
    // Esta función se mantiene con el parámetro opcional userType por compatibilidad
    // pero se debe usar sin especificar userType para la detección automática
    
    if (userType === 'cliente') {
      // Si se especifica 'cliente', usar la API normal
      try {
        const response = await api.post<LoginResponse>('/auth/login', { correo, contrasena });
        return response.data;
      } catch (error) {
        console.error('Error en login de cliente:', error);
        throw error;
      }
    } else if (userType === 'empleado') {
      // Si se especifica 'empleado', usar la API de FastAPI para empleados
      try {
        const response = await apiFast.post('/empleados/login', { correo, contrasena });
        
        // Adaptar la respuesta de FastAPI al formato que espera nuestra aplicación
        const empleado = response.data.empleado;
        
        return {
          success: true,
          data: {
            user: empleado,
            token: 'empleado_session_' + Date.now() // Token temporal
          }
        };
      } catch (error) {
        console.error('Error en login de empleado:', error);
        throw error;
      }
    } else {
      // Si no se especifica tipo, devolver el resultado para que lo maneje
      // el flujo de autenticación automática en AuthContext
      return {
        success: true,
        data: {
          user: {} as User, // Este valor será reemplazado en el contexto de autenticación
          token: ''
        }
      };
    }
  },

  // Login de cliente con FastAPI
  loginClienteFastAPI: async (correo: string, contrasena: string): Promise<any> => {
    try {
      // Usamos directamente los parámetros en el cuerpo de la petición POST
      const response = await apiFast.post('/clientes/login', {
        correo: correo,
        contrasena: contrasena
      });
      return response.data;
    } catch (error) {
      console.error('Error en login de cliente con FastAPI:', error);
      throw error;
    }
  },

  // Login de empleado con FastAPI
  loginEmpleadoFastAPI: async (correo: string, contrasena: string): Promise<any> => {
    try {
      // Usamos directamente los parámetros en el cuerpo de la petición POST
      const response = await apiFast.post('/empleados/login', {
        correo: correo,
        contrasena: contrasena
      });
      return response.data;
    } catch (error) {
      console.error('Error en login de empleado con FastAPI:', error);
      throw error;
    }
  },

  // Registro con FastAPI
  registerFastAPI: async (correo: string, contrasena: string, nombre: string, apellido: string, telefono: string, direccion: string, rut: string): Promise<any> => {
    try {
      const userData = { 
        correo, 
        contrasena, 
        nombre, 
        apellido, 
        telefono, 
        direccion,
        rut: rut.trim()
      };
      
      const response = await apiFast.post('/clientes/registro', userData);
      return response.data;
    } catch (error) {
      console.error('Error en registro con FastAPI:', error);
      throw error;
    }
  },

  register: async (correo: string, contrasena: string, nombre: string, apellido: string, telefono: string, direccion: string, rut: string): Promise<LoginResponse> => {
    // Asegurarse de que el RUT no sea nulo o vacío
    if (!rut || rut.trim() === '') {
      throw new Error('El RUT es obligatorio');
    }
    
    const userData = { 
      correo, 
      contrasena, 
      nombre, 
      apellido, 
      telefono, 
      direccion,
      rut: rut.trim()  // Asegurarse de que no haya espacios
    };
    
    // Imprimir los datos que estamos enviando para depurar
    console.log('Enviando datos al servidor:', userData);
    
    try {
      const response = await api.post<LoginResponse>('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud API:', error);
      throw error;
    }
  },

  logout: async (): Promise<ApiResponse<null>> => {
    // Eliminar el tipo de usuario almacenado
    if (isClient) {
      localStorage.removeItem('user_type');
    }
    
    const response = await api.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: {
    nombre?: string;
    apellido?: string;
    correo?: string;
    telefono?: string;
    direccion?: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    return response.data;
  },
};

// API para clientes usando FastAPI
export const clienteApiFast = {
  getAll: async (): Promise<Cliente[]> => {
    try {
      const response = await apiFast.get('/clientes');
      return response.data.clientes || [];
    } catch (error) {
      console.error('Error al obtener clientes desde FastAPI:', error);
      throw error;
    }
  },
  
  getById: async (id: number): Promise<Cliente> => {
    try {
      const response = await apiFast.get(`/clientes/${id}`);
      return response.data.cliente;
    } catch (error) {
      console.error(`Error al obtener cliente ${id} desde FastAPI:`, error);
      throw error;
    }
  },
  
  create: async (cliente: Omit<Cliente, 'id_cliente'>): Promise<Cliente> => {
    try {
      const response = await apiFast.post('/clientes', cliente);
      return response.data.cliente;
    } catch (error) {
      console.error('Error al crear cliente en FastAPI:', error);
      throw error;
    }
  },
  
  update: async (id: number, cliente: Partial<Cliente>): Promise<Cliente> => {
    try {
      const response = await apiFast.put(`/clientes/${id}`, cliente);
      return response.data.cliente;
    } catch (error) {
      console.error(`Error al actualizar cliente ${id} en FastAPI:`, error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    try {
      await apiFast.delete(`/clientes/${id}`);
    } catch (error) {
      console.error(`Error al eliminar cliente ${id} en FastAPI:`, error);
      throw error;
    }
  }
};

// API para empleados usando FastAPI
export const empleadoApiFast = {
  getAll: async (): Promise<Empleado[]> => {
    try {
      const response = await apiFast.get('/empleados');
      return response.data.empleados || [];
    } catch (error) {
      console.error('Error al obtener empleados desde FastAPI:', error);
      throw error;
    }
  },
  
  getById: async (id: number): Promise<Empleado> => {
    try {
      const response = await apiFast.get(`/empleados/${id}`);
      return response.data.empleado;
    } catch (error) {
      console.error(`Error al obtener empleado ${id} desde FastAPI:`, error);
      throw error;
    }
  },
  
  create: async (empleado: Omit<Empleado, 'id_empleado'>): Promise<Empleado> => {
    try {
      const response = await apiFast.post('/empleados', empleado);
      return response.data.empleado;
    } catch (error) {
      console.error('Error al crear empleado en FastAPI:', error);
      throw error;
    }
  },
  
  update: async (id: number, empleado: Partial<Empleado>): Promise<Empleado> => {
    try {
      const response = await apiFast.put(`/empleados/${id}`, empleado);
      return response.data.empleado;
    } catch (error) {
      console.error(`Error al actualizar empleado ${id} en FastAPI:`, error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    try {
      await apiFast.delete(`/empleados/${id}`);
    } catch (error) {
      console.error(`Error al eliminar empleado ${id} en FastAPI:`, error);
      throw error;
    }
  }
};

// API para productos usando FastAPI
export const productoApiFast = {
  getAll: async (): Promise<Producto[]> => {
    try {
      const response = await apiFast.get('/productos');
      return response.data.productos || [];
    } catch (error) {
      console.error('Error al obtener productos desde FastAPI:', error);
      throw error;
    }
  },
  
  getById: async (id: number): Promise<Producto> => {
    try {
      const response = await apiFast.get(`/productos/${id}`);
      return response.data.producto;
    } catch (error) {
      console.error(`Error al obtener producto ${id} desde FastAPI:`, error);
      throw error;
    }
  },
  
  search: async (term: string): Promise<Producto[]> => {
    try {
      const response = await apiFast.get(`/productos/buscar?q=${term}`);
      return response.data.productos || [];
    } catch (error) {
      console.error(`Error al buscar productos con "${term}" en FastAPI:`, error);
      throw error;
    }
  },
  
  getByCategoria: async (categoriaId: number): Promise<Producto[]> => {
    try {
      const response = await apiFast.get(`/productos/categoria/${categoriaId}`);
      return response.data.productos || [];
    } catch (error) {
      console.error(`Error al obtener productos de categoría ${categoriaId} en FastAPI:`, error);
      throw error;
    }
  }
};

// Función para verificar la conexión con FastAPI
export const testFastApiConnection = async (): Promise<boolean> => {
  try {
    const response = await apiFast.get('/');
    console.log('Conexión con FastAPI exitosa:', response.data);
    return true;
  } catch (error) {
    console.error('Error al conectar con FastAPI:', error);
    return false;
  }
};

export default api;