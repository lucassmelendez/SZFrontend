import axios from 'axios';

const isClient = typeof window !== 'undefined';

const API_URL = 'https://sz-backend.vercel.app/api';
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

export interface User {
  id_cliente: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: number;
  direccion: string;
}

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
  }
};

// API de autenticación
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, nombre: string, apellido: string, telefono: string, direccion: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register', { 
      email, 
      password, 
      nombre, 
      apellido, 
      telefono, 
      direccion 
    });
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    return response.data;
  },
};

export default api;