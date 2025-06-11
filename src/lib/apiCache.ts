import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { staticCache, dynamicCache, userCache, sessionCache } from './cache';
import { 
  productoApi, 
  productoApiFast, 
  authApi, 
  pedidoApiFast,
  empleadoApiFast,
  apiFast,
  Producto, 
  Pedido, 
  Cliente, 
  Empleado,
  ApiResponse
} from './api';

// Tipos para configuración de caché
interface CacheOptions {
  ttl?: number;
  skipCache?: boolean;
  invalidatePatterns?: string[];
  cacheType?: 'static' | 'dynamic' | 'user' | 'session';
}

class ApiCacheService {
  private getCacheInstance(type: string) {
    switch (type) {
      case 'static': return staticCache;
      case 'dynamic': return dynamicCache;
      case 'user': return userCache;
      case 'session': return sessionCache;
      default: return staticCache;
    }
  }

  /**
   * Wrapper genérico para llamadas con caché
   */
  private async withCache<T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl,
      skipCache = false,
      invalidatePatterns = [],
      cacheType = 'static'
    } = options;

    const cache = this.getCacheInstance(cacheType);

    // Si no se debe usar caché, ejecutar directamente
    if (skipCache) {
      const result = await apiCall();
      // Invalidar patrones relacionados después de modificaciones
      invalidatePatterns.forEach(pattern => cache.invalidatePattern(pattern));
      return result;
    }

    // Intentar obtener del caché
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData) {
      console.log(`Cache hit para: ${cacheKey}`);
      return cachedData;
    }

    // Si no está en caché, hacer la llamada
    console.log(`Cache miss para: ${cacheKey}, llamando a la API`);
    const result = await apiCall();
    
    // Guardar en caché
    cache.set(cacheKey, result, ttl);
    
    // Invalidar patrones relacionados si es necesario
    invalidatePatterns.forEach(pattern => cache.invalidatePattern(pattern));
    
    return result;
  }

  // === PRODUCTOS ===
  
  async getProductos(options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      '/productos',
      () => productoApi.getAll(),
      { cacheType: 'static', ttl: 30 * 60 * 1000, ...options }
    );
  }

  async getProductoById(id: number, options: CacheOptions = {}): Promise<Producto> {
    return this.withCache(
      `/productos/${id}`,
      () => productoApi.getById(id),
      { cacheType: 'static', ttl: 30 * 60 * 1000, ...options }
    );
  }

  async searchProductos(term: string, options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      `/productos/search_${term}`,
      () => productoApi.search(term),
      { cacheType: 'dynamic', ttl: 5 * 60 * 1000, ...options }
    );
  }

  async getProductosByCategoria(categoriaId: number, options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      `/productos/categoria/${categoriaId}`,
      () => productoApi.getByCategoria(categoriaId),
      { cacheType: 'static', ttl: 20 * 60 * 1000, ...options }
    );
  }

  async getProductosRelacionados(categoriaId: number, excludeId?: number, limit: number = 4, options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      `/productos/relacionados/${categoriaId}_${excludeId}_${limit}`,
      async () => {
        const productos = await productoApi.getByCategoria(categoriaId);
        let filtered = excludeId ? productos.filter(p => p.id_producto !== excludeId) : productos;
        return filtered.slice(0, limit);
      },
      { cacheType: 'static', ttl: 25 * 60 * 1000, ...options }
    );
  }

  async getProductosDestacados(limit: number = 8, options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      `/productos/destacados_${limit}`,
      async () => {
        // Combinar productos más vendidos con productos normales si no hay suficientes
        try {
          const masVendidos = await productoApi.getMasVendidos(limit);
          if (masVendidos.length >= limit) {
            return masVendidos.slice(0, limit);
          }
          
          // Si no hay suficientes productos más vendidos, completar con productos normales
          const todosProductos = await productoApi.getAll();
          const productosRestantes = todosProductos
            .filter(p => !masVendidos.some(mv => mv.id_producto === p.id_producto))
            .slice(0, limit - masVendidos.length);
          
          return [...masVendidos, ...productosRestantes];
        } catch (error) {
          console.error('Error al obtener productos destacados:', error);
          // Fallback a productos normales
          const productos = await productoApi.getAll();
          return productos.slice(0, limit);
        }
      },
      { cacheType: 'static', ttl: 15 * 60 * 1000, ...options }
    );
  }

  async updateProductoStock(id: number, stock: number): Promise<Producto> {
    return this.withCache(
      `/productos/${id}/stock`,
      () => productoApi.updateStock(id, stock),
      { 
        skipCache: true, 
        invalidatePatterns: [`productos*`, `productos_${id}*`],
        cacheType: 'dynamic'
      }
    );
  }

  async getProductosMasVendidos(limit: number = 15, options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      `/productos/mas-vendidos_${limit}`,
      () => productoApi.getMasVendidos(limit),
      { cacheType: 'dynamic', ttl: 10 * 60 * 1000, ...options }
    );
  }

  // === PRODUCTOS FASTAPI ===

  async getProductosFast(options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      '/productos-fast',
      () => productoApiFast.getAll(),
      { cacheType: 'static', ttl: 30 * 60 * 1000, ...options }
    );
  }

  async getProductoByIdFast(id: number, options: CacheOptions = {}): Promise<Producto> {
    return this.withCache(
      `/productos-fast/${id}`,
      () => productoApiFast.getById(id),
      { cacheType: 'static', ttl: 30 * 60 * 1000, ...options }
    );
  }

  async searchProductosFast(term: string, options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      `/productos-fast/search_${term}`,
      () => productoApiFast.search(term),
      { cacheType: 'dynamic', ttl: 5 * 60 * 1000, ...options }
    );
  }

  async getProductosByCategoriaFast(categoriaId: number, options: CacheOptions = {}): Promise<Producto[]> {
    return this.withCache(
      `/productos-fast/categoria/${categoriaId}`,
      () => productoApiFast.getByCategoria(categoriaId),
      { cacheType: 'static', ttl: 20 * 60 * 1000, ...options }
    );
  }

  // === PEDIDOS ===

  async getPedidos(options: CacheOptions = {}): Promise<Pedido[]> {
    return this.withCache(
      '/pedidos',
      () => pedidoApiFast.getAll(),
      { cacheType: 'dynamic', ttl: 2 * 60 * 1000, ...options }
    );
  }

  async getPedidoById(id: number, options: CacheOptions = {}): Promise<Pedido> {
    return this.withCache(
      `/pedidos/${id}`,
      () => pedidoApiFast.getById(id),
      { cacheType: 'dynamic', ttl: 5 * 60 * 1000, ...options }
    );
  }

  async getPedidosByCliente(idCliente: number, options: CacheOptions = {}): Promise<Pedido[]> {
    return this.withCache(
      `/pedidos/cliente/${idCliente}`,
      () => pedidoApiFast.getByCliente(idCliente),
      { cacheType: 'user', ttl: 10 * 60 * 1000, ...options }
    );
  }

  async createPedido(pedido: Omit<Pedido, 'id_pedido'>): Promise<Pedido> {
    return this.withCache(
      '/pedidos/create',
      () => pedidoApiFast.create(pedido),
      { 
        skipCache: true, 
        invalidatePatterns: ['pedidos*'],
        cacheType: 'dynamic'
      }
    );
  }

  async updatePedidoEstado(id: number, estado: 'accepted' | 'rejected'): Promise<Pedido> {
    return this.withCache(
      `/pedidos/${id}/estado`,
      () => pedidoApiFast.updateEstado(id, estado),
      { 
        skipCache: true, 
        invalidatePatterns: [`pedidos*`, `pedidos_${id}*`],
        cacheType: 'dynamic'
      }
    );
  }

  // === EMPLEADOS ===

  async getEmpleados(options: CacheOptions = {}): Promise<Empleado[]> {
    return this.withCache(
      '/empleados',
      () => empleadoApiFast.getAll(),
      { cacheType: 'user', ttl: 15 * 60 * 1000, ...options }
    );
  }

  async getEmpleadoById(id: number, options: CacheOptions = {}): Promise<Empleado> {
    return this.withCache(
      `/empleados/${id}`,
      () => empleadoApiFast.getById(id),
      { cacheType: 'user', ttl: 15 * 60 * 1000, ...options }
    );
  }

  async createEmpleado(empleado: Omit<Empleado, 'id_empleado'>): Promise<Empleado> {
    return this.withCache(
      '/empleados/create',
      () => empleadoApiFast.create(empleado),
      { 
        skipCache: true, 
        invalidatePatterns: ['empleados*'],
        cacheType: 'user'
      }
    );
  }

  async updateEmpleado(id: number, empleado: Partial<Empleado>): Promise<Empleado> {
    return this.withCache(
      `/empleados/${id}/update`,
      () => empleadoApiFast.update(id, empleado),
      { 
        skipCache: true, 
        invalidatePatterns: [`empleados*`, `empleados_${id}*`],
        cacheType: 'user'
      }
    );
  }

  // === CLIENTES ===

  async getClientes(options: CacheOptions = {}): Promise<Cliente[]> {
    return this.withCache(
      '/clientes',
      () => apiFast.get('/clientes').then((res: any) => res.data),
      { cacheType: 'user', ttl: 15 * 60 * 1000, ...options }
    );
  }

  async getClienteById(id: number, options: CacheOptions = {}): Promise<Cliente> {
    return this.withCache(
      `/clientes/${id}`,
      () => apiFast.get(`/clientes/${id}`).then((res: any) => res.data),
      { cacheType: 'user', ttl: 15 * 60 * 1000, ...options }
    );
  }

  // === AUTENTICACIÓN ===

  async login(correo: string, contrasena: string, userType?: 'cliente' | 'empleado') {
    // No cachear login por seguridad
    return authApi.login(correo, contrasena, userType);
  }

  async logout() {
    // Limpiar cachés de usuario al hacer logout
    userCache.clear();
    sessionCache.clear();
    return authApi.logout();
  }

  async getProfile(options: CacheOptions = {}) {
    return this.withCache(
      '/profile',
      () => authApi.getProfile(),
      { cacheType: 'session', ttl: 30 * 60 * 1000, ...options }
    );
  }

  // === MÉTODOS DE GESTIÓN DE CACHÉ ===

  /**
   * Invalida todo el caché
   */
  clearAllCache(): void {
    staticCache.clear();
    dynamicCache.clear();
    userCache.clear();
    sessionCache.clear();
    console.log('Todo el caché ha sido limpiado');
  }

  /**
   * Invalida caché de productos
   */
  invalidateProductsCache(): void {
    staticCache.invalidatePattern('productos*');
    dynamicCache.invalidatePattern('productos*');
    console.log('Caché de productos invalidado');
  }

  /**
   * Invalida caché de pedidos
   */
  invalidateOrdersCache(): void {
    dynamicCache.invalidatePattern('pedidos*');
    userCache.invalidatePattern('pedidos*');
    console.log('Caché de pedidos invalidado');
  }

  /**
   * Invalida caché de usuarios
   */
  invalidateUsersCache(): void {
    userCache.invalidatePattern('empleados*');
    sessionCache.invalidatePattern('profile*');
    console.log('Caché de usuarios invalidado');
  }

  /**
   * Obtiene estadísticas de todos los cachés
   */
  getCacheStats() {
    return {
      static: staticCache.getStats(),
      dynamic: dynamicCache.getStats(),
      user: userCache.getStats(),
      session: sessionCache.getStats()
    };
  }

  /**
   * Invalida caché específico del dashboard de admin
   */
  invalidateDashboardCache(): void {
    // Invalidar pedidos (datos dinámicos del dashboard)
    dynamicCache.invalidatePattern('pedidos*');
    
    // Invalidar usuarios/clientes (datos del dashboard)
    userCache.invalidatePattern('empleados*');
    userCache.invalidatePattern('clientes*');
    
    console.log('Caché del dashboard invalidado');
  }

  /**
   * Precargar datos críticos en el caché
   */
  async preloadCriticalData(): Promise<void> {
    console.log('Precargando datos críticos...');
    
    try {
      // Precargar productos (datos más accedidos)
      await Promise.allSettled([
        this.getProductos(),
        this.getProductosMasVendidos(),
        // Precargar datos del dashboard para admin
        this.getPedidos({ cacheType: 'dynamic' }),
        this.getClientes({ cacheType: 'user' }),
        // Añadir más precargas según necesidades
      ]);
      
      console.log('Datos críticos precargados exitosamente');
    } catch (error) {
      console.error('Error al precargar datos críticos:', error);
    }
  }
}

// Crear instancia singleton
export const apiCache = new ApiCacheService();

// Hook personalizado para React (opcional)
export const useApiCache = () => {
  return {
    ...apiCache,
    // Funciones adicionales específicas para React si es necesario
  };
};

export default apiCache; 