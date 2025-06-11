import axios, { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { staticCache, dynamicCache, userCache, sessionCache } from './cache';

// Configuración de rutas y sus tipos de caché
const CACHE_CONFIG = {
  // Rutas que usan caché estático (larga duración)
  static: [
    '/productos',
    '/categorias',
    '/marcas',
  ],
  
  // Rutas que usan caché dinámico (corta duración)
  dynamic: [
    '/productos/mas-vendidos',
    '/productos/search',
    '/stock',
    '/pedidos',
  ],
  
  // Rutas que usan caché de usuario
  user: [
    '/empleados',
    '/clientes',
  ],
  
  // Rutas que usan caché de sesión
  session: [
    '/auth/profile',
    '/auth/user',
  ],
  
  // Rutas que nunca se deben cachear
  noCache: [
    '/auth/login',
    '/auth/logout',
    '/auth/register',
    '/webpay',
    '/payment',
  ]
};

// TTL por defecto para cada tipo de caché (en milisegundos)
const DEFAULT_TTL = {
  static: 30 * 60 * 1000,   // 30 minutos
  dynamic: 2 * 60 * 1000,   // 2 minutos
  user: 15 * 60 * 1000,     // 15 minutos
  session: 60 * 60 * 1000,  // 1 hora
};

// Función para determinar el tipo de caché basado en la URL
function getCacheType(url: string): keyof typeof CACHE_CONFIG | null {
  // Verificar si no debe cachearse
  if (CACHE_CONFIG.noCache.some(pattern => url.includes(pattern))) {
    return null;
  }
  
  // Verificar cada tipo de caché
  for (const [type, patterns] of Object.entries(CACHE_CONFIG)) {
    if (type === 'noCache') continue;
    
    if (patterns.some(pattern => url.includes(pattern))) {
      return type as keyof typeof CACHE_CONFIG;
    }
  }
  
  return null;
}

// Función para obtener la instancia de caché correcta
function getCacheInstance(type: string) {
  switch (type) {
    case 'static': return staticCache;
    case 'dynamic': return dynamicCache;
    case 'user': return userCache;
    case 'session': return sessionCache;
    default: return staticCache;
  }
}

// Función para generar clave de caché
function generateCacheKey(config: InternalAxiosRequestConfig): string {
  const url = config.url || '';
  const method = config.method || 'get';
  const params = JSON.stringify(config.params || {});
  const data = JSON.stringify(config.data || {});
  
  return `${method}_${url}_${params}_${data}`.replace(/[^\w]/g, '_');
}

// Función para verificar si la response debe ser cacheada
function shouldCacheResponse(response: AxiosResponse): boolean {
  // Solo cachear respuestas exitosas
  if (response.status < 200 || response.status >= 300) {
    return false;
  }
  
  // Solo cachear métodos GET
  return response.config.method?.toLowerCase() === 'get';
}

// Interceptor de request para verificar caché antes de hacer la petición
function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  // Solo interceptar requests GET
  if (config.method?.toLowerCase() !== 'get') {
    return config;
  }
  
  const url = config.url || '';
  const cacheType = getCacheType(url);
  
  if (!cacheType) {
    return config;
  }
  
  const cache = getCacheInstance(cacheType);
  const cacheKey = generateCacheKey(config);
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log(`Cache hit para: ${url}`);
    // Crear una respuesta falsa para evitar la petición HTTP
    (config as any).__cached_response = {
      data: cachedData,
      status: 200,
      statusText: 'OK (Cached)',
      headers: {},
      config,
    };
  }
  
  return config;
}

// Interceptor de response para cachear respuestas
function responseInterceptor(response: AxiosResponse): AxiosResponse {
  // Si es una respuesta cacheada, devolverla directamente
  if ((response.config as any).__cached_response) {
    return (response.config as any).__cached_response;
  }
  
  if (!shouldCacheResponse(response)) {
    return response;
  }
  
  const url = response.config.url || '';
  const cacheType = getCacheType(url);
  
  if (!cacheType) {
    return response;
  }
  
  const cache = getCacheInstance(cacheType);
  const cacheKey = generateCacheKey(response.config as InternalAxiosRequestConfig);
  const ttl = DEFAULT_TTL[cacheType as keyof typeof DEFAULT_TTL];
  
  // Cachear la respuesta
  cache.set(cacheKey, response.data, ttl);
  console.log(`Cached response para: ${url}`);
  
  return response;
}

// Interceptor de error para manejar errores de red
function errorInterceptor(error: any) {
  // Si hay un error de red y tenemos datos cacheados, intentar usarlos
  if (error.code === 'NETWORK_ERROR' || error.code === 'ENOTFOUND') {
    const config = error.config;
    const url = config?.url || '';
    const cacheType = getCacheType(url);
    
    if (cacheType && config?.method?.toLowerCase() === 'get') {
      const cache = getCacheInstance(cacheType);
      const cacheKey = generateCacheKey(config);
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`Usando datos cacheados debido a error de red: ${url}`);
        return Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK (Cached - Network Error)',
          headers: {},
          config,
        });
      }
    }
  }
  
  return Promise.reject(error);
}

// Función para invalidar caché basado en operaciones
function invalidateCacheForOperation(config: InternalAxiosRequestConfig) {
  const url = config.url || '';
  const method = config.method?.toLowerCase() || '';
  
  // Invalidar caché después de operaciones que modifican datos
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    if (url.includes('/productos')) {
      staticCache.invalidatePattern('*productos*');
      dynamicCache.invalidatePattern('*productos*');
      console.log('Cache de productos invalidado por operación:', method, url);
    }
    
    if (url.includes('/pedidos')) {
      dynamicCache.invalidatePattern('*pedidos*');
      userCache.invalidatePattern('*pedidos*');
      console.log('Cache de pedidos invalidado por operación:', method, url);
    }
    
    if (url.includes('/empleados') || url.includes('/clientes')) {
      userCache.invalidatePattern('*empleados*');
      userCache.invalidatePattern('*clientes*');
      console.log('Cache de usuarios invalidado por operación:', method, url);
    }
  }
}

// Configurar interceptores en las instancias de axios
export function setupCacheInterceptors(apiInstance: typeof axios, apiFastInstance: typeof axios) {
  // Interceptores para la API principal
  apiInstance.interceptors.request.use(
    (config) => {
      const result = requestInterceptor(config);
      return result;
    },
    (error) => Promise.reject(error)
  );
  
  apiInstance.interceptors.response.use(
    (response) => {
      invalidateCacheForOperation(response.config as InternalAxiosRequestConfig);
      return responseInterceptor(response);
    },
    errorInterceptor
  );
  
  // Interceptores para FastAPI
  apiFastInstance.interceptors.request.use(
    (config) => {
      const result = requestInterceptor(config);
      return result;
    },
    (error) => Promise.reject(error)
  );
  
  apiFastInstance.interceptors.response.use(
    (response) => {
      invalidateCacheForOperation(response.config as InternalAxiosRequestConfig);
      return responseInterceptor(response);
    },
    errorInterceptor
  );
  
  console.log('Cache interceptors configurados correctamente');
}

// Funciones de utilidad para gestión manual del caché
export const cacheUtils = {
  // Limpiar todo el caché
  clearAll: () => {
    staticCache.clear();
    dynamicCache.clear();
    userCache.clear();
    sessionCache.clear();
    console.log('Todo el caché limpiado');
  },
  
  // Invalidar caché por patrón
  invalidatePattern: (pattern: string) => {
    staticCache.invalidatePattern(pattern);
    dynamicCache.invalidatePattern(pattern);
    userCache.invalidatePattern(pattern);
    sessionCache.invalidatePattern(pattern);
    console.log(`Patrón ${pattern} invalidado en todos los cachés`);
  },
  
  // Obtener estadísticas
  getStats: () => ({
    static: staticCache.getStats(),
    dynamic: dynamicCache.getStats(),
    user: userCache.getStats(),
    session: sessionCache.getStats(),
  }),
};

export default setupCacheInterceptors; 