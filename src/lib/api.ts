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

// Interfaces para pedidos
export interface Pedido {
  id_pedido?: number;
  fecha: string;
  medio_pago_id: number;
  id_estado_envio: number;
  id_estado: number;
  id_cliente: number;
  cliente?: {
    correo: string;
    nombre: string;
    apellido: string;
    telefono: string;
    direccion: string;
  };
}

export interface PedidoProducto {
  id_pedido_producto?: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
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
  primer_login?: boolean;
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
  
  getMasVendidos: async (limit: number = 15): Promise<Producto[]> => {
    try {
      const response = await apiFast.get<Producto[]>(`/pedido-producto/productos/mas-vendidos?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
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
    }  },
  // Login de empleado con FastAPI
  loginEmpleadoFastAPI: async (correo: string, contrasena: string): Promise<any> => {
    try {
      // Usamos directamente los parámetros en el cuerpo de la petición POST
      const response = await apiFast.post('/empleados/login', {
        correo: correo,
        contrasena: contrasena
      });
      
      // Verificar si es un primer inicio de sesión
      if (response.data && response.data.empleado) {
        // Si el backend ya envía esta información, la respetamos
        if (response.data.empleado.hasOwnProperty('primer_login')) {
          console.log('Primer login detectado desde el backend:', response.data.empleado.primer_login);
        } else {
          // Si no, usamos la lógica de respaldo: asumir que es primer login si contraseña = correo
          response.data.empleado.primer_login = (correo === contrasena);
          console.log('Asumiendo primer login:', response.data.empleado.primer_login, 'correo:', correo, 'contraseña igual a correo:', (correo === contrasena));
        }
      }
      
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
    currentPassword?: string;
    newPassword?: string;
    contrasena?: string;
  }): Promise<ApiResponse<User>> => {
    try {
      // Verificar si estamos usando un token de FastAPI
      const token = localStorage.getItem('auth_token');
      const userType = localStorage.getItem('user_type');
      
      // Si es un cliente autenticado con FastAPI
      if (token && token.startsWith('cliente_fastapi_') && userType === 'cliente') {
        // Recuperar los datos del cliente del localStorage
        const clienteData = localStorage.getItem('cliente_data');
        if (!clienteData) {
          throw new Error('No se encontraron datos del cliente');
        }
        
        const cliente = JSON.parse(clienteData);
        
        // Preparar datos para actualizar el perfil usando la API FastAPI para clientes
        const updateData = {
          ...data,
          id_cliente: cliente.id_cliente
        };
        
        // Usar la API FastAPI para actualizar el cliente
        const response = await apiFast.put(`/clientes/${cliente.id_cliente}`, updateData);
        
        if (response.data && response.data.cliente) {
          // Actualizar datos en localStorage
          localStorage.setItem('cliente_data', JSON.stringify(response.data.cliente));
          
          // Retornar en el formato esperado por la aplicación
          return {
            success: true,
            data: response.data.cliente
          };
        } else {
          throw new Error('Respuesta inesperada del servidor');
        }
      } 
      // Si es un empleado autenticado con FastAPI
      else if (token && token.startsWith('empleado_session_') && userType === 'empleado') {
        // Recuperar los datos del empleado del localStorage
        const empleadoData = localStorage.getItem('empleado_data');
        if (!empleadoData) {
          throw new Error('No se encontraron datos del empleado');
        }
        
        const empleado = JSON.parse(empleadoData);
        
        // Para los empleados, solo permitimos actualizar la contraseña
        if (data.newPassword || data.contrasena) {
          // Usar la función de actualización de empleado
          const updateData = new URLSearchParams();
          
          // Asegurar que enviamos la contraseña con el nombre correcto
          if (data.newPassword) {
            updateData.append('contrasena', data.newPassword);
          } else if (data.contrasena) {
            updateData.append('contrasena', data.contrasena);
          }
          
          // Actualizar el empleado con su contraseña
          const response = await apiFast.put(`/empleados/${empleado.id_empleado}?${updateData.toString()}`);
          
          if (response.data && response.data.empleado) {
            // Actualizar datos en localStorage
            localStorage.setItem('empleado_data', JSON.stringify(response.data.empleado));
            
            // Retornar en el formato esperado
            return {
              success: true,
              data: response.data.empleado
            };
          } else {
            throw new Error('Respuesta inesperada del servidor');
          }
        } else {
          throw new Error('Para empleados, solo se permite cambiar la contraseña');
        }
      } else {
        // Usar la API normal para actualizar el perfil
        const response = await api.put<ApiResponse<User>>('/auth/profile', data);
        return response.data;
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  },

  getPedidosCliente: async (clienteId: number): Promise<Pedido[]> => {
    try {
      const response = await apiFast.get(`/pedidos/cliente/${clienteId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener pedidos del cliente:', error);
      throw error;
    }
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
      console.log(`Actualizando cliente ${id} con datos:`, cliente);
      
      // Enviar los datos en el cuerpo de la solicitud
      const response = await apiFast.put(`/clientes/${id}`, { 
        ...cliente 
      });
      
      if (!response.data || !response.data.cliente) {
        throw new Error(`Respuesta incompleta al actualizar cliente: ${JSON.stringify(response.data)}`);
      }
      
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
  
  create: async (empleado: any): Promise<Empleado> => {
    try {
      // Log de los datos recibidos
      console.log('Datos del empleado a crear:', empleado);

      // Asegurarse de que los campos requeridos estén presentes
      if (!empleado.nombre || !empleado.apellido || !empleado.correo || 
          !empleado.rut || !empleado.contrasena || !empleado.rol_id) {
        throw new Error('Faltan campos requeridos');
      }

      // Formatear el RUT (eliminar espacios y asegurar que tiene guión)
      let rutFormateado = empleado.rut.trim().replace(/\s/g, '');
      // Si el RUT no tiene guión y tiene al menos 7 caracteres, insertamos el guión
      if (!rutFormateado.includes('-') && rutFormateado.length >= 7) {
        rutFormateado = rutFormateado.slice(0, -1) + '-' + rutFormateado.slice(-1);
      }

      // Preparar los datos con exactamente los mismos nombres de campo que espera el backend
      const datosEmpleado = {
        nombre: empleado.nombre.trim(),
        apellido: empleado.apellido.trim(),
        correo: empleado.correo.trim(),
        rut: rutFormateado,
        contrasena: empleado.contrasena,
        rol_id: Number(empleado.rol_id),
        direccion: empleado.direccion?.trim() || 'N/A',
        telefono: empleado.telefono?.trim() || 'N/A'
      };

      console.log('Datos a enviar:', datosEmpleado);

      // Enviar simplemente como JSON, siguiendo el mismo patrón del endpoint de clientes
      const response = await apiFast.post('/empleados', datosEmpleado);
      
      if (!response.data || !response.data.empleado) {
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('Respuesta exitosa del servidor:', response.data);
      return response.data.empleado;
    } catch (error: any) {
      console.error('Error detallado al crear empleado:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message
      });

      // Mejorar el mensaje de error para el usuario
      if (error.response?.status === 422) {
        try {
          const detailMessage = error.response.data?.detail;
          if (Array.isArray(detailMessage)) {
            // FastAPI suele enviar un array de errores de validación
            const errorMessages = detailMessage.map(item => 
              `Campo '${item.loc[1]}': ${item.msg}`
            ).join(', ');
            throw new Error(`Error de validación: ${errorMessages}`);
          } else if (typeof detailMessage === 'string') {
            throw new Error(detailMessage);
          } else if (typeof error.response.data === 'object') {
            // Intentar extraer mensaje de error de otras estructuras posibles
            throw new Error(JSON.stringify(error.response.data));
          }
        } catch (parseError) {
          console.error('Error al parsear mensaje de error:', parseError);
        }
        
        // Si no podemos extraer detalles específicos
        throw new Error(`Error de validación (422): ${error.response?.data?.detail || 'Verifica el formato de los datos'}`);
      }
      
      // Para otros tipos de errores
      throw new Error(`Error al crear empleado: ${error.message || 'Error desconocido'}`);
    }
  },
  
  update: async (id: number, empleado: Partial<Empleado>): Promise<Empleado> => {
    try {
      console.log(`Actualizando empleado ${id} con datos:`, empleado);
      
      // En lugar de enviar un objeto, enviamos los campos como parámetros URL
      // para que coincida con la manera en que el backend espera recibirlos
      const params = new URLSearchParams();
      
      if (empleado.nombre) params.append('nombre', empleado.nombre);
      if (empleado.apellido) params.append('apellido', empleado.apellido);
      if (empleado.correo) params.append('correo', empleado.correo);
      if (empleado.direccion) params.append('direccion', empleado.direccion);
      if (empleado.telefono) params.append('telefono', String(empleado.telefono));
      if (empleado.rol_id) params.append('rol_id', String(empleado.rol_id));
      if (empleado.rut) params.append('rut', empleado.rut);
      
      console.log('Parámetros a enviar:', params.toString());
      
      // Hacer la petición PUT al servidor con los parámetros en la URL
      const response = await apiFast.put(`/empleados/${id}?${params.toString()}`);
      
      if (response.data && response.data.empleado) {
        console.log('Respuesta exitosa:', response.data);
        return response.data.empleado;
      }
      
      throw new Error(`Respuesta inesperada: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      console.error(`Error al actualizar empleado ${id} en FastAPI:`, error);
      
      let mensajeError = error.message || 'Error desconocido';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          mensajeError = `Error 400: ${data?.detail || 'Datos inválidos'}`;
        } else if (status === 404) {
          mensajeError = `Error 404: No se encontró el empleado con ID ${id}`;
        } else if (status === 422) {
          if (Array.isArray(data?.detail)) {
            mensajeError = `Error de validación: ${data.detail.map((item: any) => item.msg).join(', ')}`;
          } else {
            mensajeError = `Error de validación: ${data?.detail || 'Formato incorrecto'}`;
          }
        } else {
          mensajeError = `Error ${status}: ${data?.detail || error.message}`;
        }
        
        console.error(`Detalles del error HTTP (${status}):`, data);
      }
      
      throw new Error(mensajeError);
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

// API para pedidos usando FastAPI
export const pedidoApiFast = {
  getAll: async (): Promise<Pedido[]> => {
    try {
      const response = await apiFast.get('/pedidos');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener pedidos desde FastAPI:', error);
      throw error;
    }
  },
  
  getById: async (id: number): Promise<Pedido> => {
    try {
      const response = await apiFast.get(`/pedidos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener pedido ${id} desde FastAPI:`, error);
      throw error;
    }
  },
  
  getByCliente: async (idCliente: number): Promise<Pedido[]> => {
    try {
      const response = await apiFast.get(`/pedidos/cliente/${idCliente}`);
      return response.data || [];
    } catch (error) {
      console.error(`Error al obtener pedidos del cliente ${idCliente} desde FastAPI:`, error);
      throw error;
    }
  },
  
  create: async (pedido: Omit<Pedido, 'id_pedido'>): Promise<Pedido> => {
    try {
      console.log('Creando pedido con datos exactos:', pedido);
      
      // Asegurarse de que los campos tienen exactamente los mismos nombres
      const datos = {
        fecha: pedido.fecha,
        medio_pago_id: pedido.medio_pago_id,
        id_estado_envio: pedido.id_estado_envio,
        id_estado: pedido.id_estado,
        id_cliente: pedido.id_cliente
      };
      
      console.log('Datos formateados para enviar:', datos);
      
      const response = await apiFast.post('/pedidos', datos);
      console.log('Respuesta completa del servidor:', response);
      
      // La respuesta ahora es directamente el objeto creado
      if (response.data && response.data.id_pedido) {
        return response.data;
      }
      
      // Si no obtenemos un pedido directo, intentamos extraerlo de otras posibles estructuras
      let pedidoCreado: Pedido | null = null;
      
      if (response.data && response.data.pedido) {
        // Estructura anterior: { mensaje: '...', pedido: {...} }
        pedidoCreado = response.data.pedido;
      } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Posible estructura alternativa: retorno directo del array de datos
        pedidoCreado = response.data[0];
      } 
      
      if (!pedidoCreado) {
        console.error('No se pudo extraer el pedido de la respuesta:', response.data);
        throw new Error(`Respuesta inesperada al crear pedido: ${JSON.stringify(response.data || 'Sin datos')}`);
      }
      
      return pedidoCreado;
    } catch (error) {
      console.error('Error al crear pedido en FastAPI:', error);
      throw error;
    }
  },
  
  update: async (id: number, pedido: Partial<Pedido>): Promise<Pedido> => {
    try {
      const response = await apiFast.put(`/pedidos/${id}`, pedido);
      return response.data.pedido;
    } catch (error) {
      console.error(`Error al actualizar pedido ${id} en FastAPI:`, error);
      throw error;
    }
  },    updateEstado: async (id: number, estado: 'accepted' | 'rejected'): Promise<Pedido> => {
    try {
      console.log(`Actualizando estado del pedido ${id} a ${estado}`);
      const response = await apiFast.patch(`/pedidos/${id}/status`, { nuevo_estado: estado });
      console.log('Respuesta del servidor:', response.data);
      return response.data.pedido;
    } catch (error) {
      console.error(`Error al actualizar estado del pedido ${id} en FastAPI:`, error);
      throw error;
    }
  },
  updateEstadoEnvio: async (id: number, idEstadoEnvio: number): Promise<Pedido> => {
    try {
      const response = await apiFast.patch(`/pedidos/${id}/estado-envio`, idEstadoEnvio);
      return response.data.pedido;
    } catch (error) {
      console.error(`Error al actualizar estado de envío del pedido ${id} en FastAPI:`, error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    try {
      await apiFast.delete(`/pedidos/${id}`);
    } catch (error) {
      console.error(`Error al eliminar pedido ${id} en FastAPI:`, error);
      throw error;
    }
  }
};

// API para pedido_producto usando FastAPI
export const pedidoProductoApiFast = {
  getByPedido: async (idPedido: number): Promise<PedidoProducto[]> => {
    try {
      const response = await apiFast.get(`/pedido-producto/pedido/${idPedido}`);
      return response.data || [];
    } catch (error) {
      console.error(`Error al obtener productos del pedido ${idPedido} desde FastAPI:`, error);
      throw error;
    }
  },
  
  getByProducto: async (idProducto: number): Promise<PedidoProducto[]> => {
    try {
      const response = await apiFast.get(`/pedido-producto/producto/${idProducto}`);
      return response.data || [];
    } catch (error) {
      console.error(`Error al obtener pedidos con el producto ${idProducto} desde FastAPI:`, error);
      throw error;
    }
  },
  
  add: async (pedidoProducto: PedidoProducto): Promise<PedidoProducto> => {
    try {
      console.log(`Agregando producto ${pedidoProducto.id_producto} al pedido ${pedidoProducto.id_pedido}`, pedidoProducto);
      
      // Asegurarse de enviar todos los campos con los nombres exactos
      const datos = {
        id_pedido: pedidoProducto.id_pedido,
        id_producto: pedidoProducto.id_producto,
        cantidad: pedidoProducto.cantidad,
        precio_unitario: pedidoProducto.precio_unitario,
        subtotal: pedidoProducto.subtotal
      };
      
      const response = await apiFast.post('/pedido-producto', datos);
      console.log('Respuesta al agregar producto:', response.data);
      
      // Ahora el endpoint devuelve directamente el objeto creado o el objeto con mensaje
      if (response.data) {
        if (response.data.id_pedido_producto || 
            (response.data.id_pedido && response.data.id_producto)) {
          return response.data;
        } else if (response.data.pedido_producto) {
          return response.data.pedido_producto;
        }
      }
      
      // Si no pudimos extraer el objeto, pero la petición fue exitosa,
      // devolvemos el objeto original que enviamos
      return pedidoProducto;
    } catch (error) {
      console.error('Error al agregar producto al pedido en FastAPI:', error);
      throw error;
    }
  },
  
  addBulk: async (idPedido: number, productos: PedidoProducto[]): Promise<PedidoProducto[]> => {
    try {
      console.log(`Enviando ${productos.length} productos al pedido ${idPedido}`);
      console.log('Ejemplo del primer producto:', productos[0]);
      
      const data = {
        productos: productos
      };
      
      const response = await apiFast.post(`/pedido-producto/bulk/${idPedido}`, data);
      console.log('Respuesta completa del bulk insert:', response.data);
      
      // Intentar extraer los productos de diferentes posibles estructuras de respuesta
      let productosAgregados: PedidoProducto[] = [];
      
      if (response.data && response.data.productos && Array.isArray(response.data.productos)) {
        // Estructura esperada: { mensaje: '...', productos: [...] }
        productosAgregados = response.data.productos;
      } else if (response.data && Array.isArray(response.data)) {
        // Posible estructura alternativa: retorno directo del array de datos
        productosAgregados = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Otra posible estructura: { data: [...] }
        productosAgregados = response.data.data;
      }
      
      if (productosAgregados.length === 0 && response.status === 200) {
        // Si hay un status 200 pero no hay datos, asumimos que funcionó
        console.warn('Se recibió respuesta 200 pero sin datos de productos');
        return productos; // Devolvemos los productos originales
      }
      
      return productosAgregados;
    } catch (error) {
      console.error(`Error al agregar múltiples productos al pedido ${idPedido} en FastAPI:`, error);
      // Reintentamos con una estrategia alternativa en caso de error
      try {
        console.log('Reintentando agregar productos uno por uno...');
        const resultados = [];
        for (const producto of productos) {
          try {
            const resultado = await pedidoProductoApiFast.add(producto);
            resultados.push(resultado);
          } catch (singleError) {
            console.warn(`Error al agregar producto individual ${producto.id_producto}:`, singleError);
            // Continuamos con el siguiente producto
          }
        }
        if (resultados.length > 0) {
          console.log(`Se agregaron ${resultados.length} de ${productos.length} productos individualmente`);
          return resultados;
        }
      } catch (retryError) {
        console.error('Error al reintentar agregar productos individualmente:', retryError);
      }
      throw error;
    }
  },
  
  update: async (idPedido: number, idProducto: number, datos: Partial<PedidoProducto>): Promise<PedidoProducto> => {
    try {
      const response = await apiFast.put(`/pedido-producto/${idPedido}/${idProducto}`, datos);
      return response.data.pedido_producto;
    } catch (error) {
      console.error(`Error al actualizar producto ${idProducto} en pedido ${idPedido} en FastAPI:`, error);
      throw error;
    }
  },
  
  remove: async (idPedido: number, idProducto: number): Promise<void> => {
    try {
      await apiFast.delete(`/pedido-producto/${idPedido}/${idProducto}`);
    } catch (error) {
      console.error(`Error al eliminar producto ${idProducto} del pedido ${idPedido} en FastAPI:`, error);
      throw error;
    }
  },
  
  getById: async (idPedidoProducto: number): Promise<PedidoProducto> => {
    try {
      const response = await apiFast.get(`/pedido-producto/${idPedidoProducto}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener detalle de pedido-producto ${idPedidoProducto} desde FastAPI:`, error);
      throw error;
    }
  }
};

export default api;