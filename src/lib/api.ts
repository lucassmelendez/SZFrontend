import axios from 'axios';

// Crear una instancia de axios con la URL base
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Funciones para interactuar con la API
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

export default api; 