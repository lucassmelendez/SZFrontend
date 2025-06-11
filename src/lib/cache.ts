interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  key: string;
}

interface CacheConfig {
  defaultTTL: number; // Time to live en milisegundos
  maxMemoryEntries: number;
  enableLocalStorage: boolean;
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos por defecto
      maxMemoryEntries: 100,
      enableLocalStorage: true,
      ...config
    };
  }

  /**
   * Genera una clave de caché basada en la URL y parámetros
   */
  private generateKey(url: string, params?: any): string {
    const baseKey = url.replace(/[^\w]/g, '_');
    if (params) {
      const paramString = JSON.stringify(params);
      return `${baseKey}_${btoa(paramString).slice(0, 10)}`;
    }
    return baseKey;
  }

  /**
   * Verifica si una entrada de caché es válida
   */
  private isValidEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiry;
  }

  /**
   * Limpia entradas expiradas del caché en memoria
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Mantiene el tamaño del caché en memoria dentro del límite
   */
  private enforceSizeLimit(): void {
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      // Eliminar las entradas más antiguas
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, this.memoryCache.size - this.config.maxMemoryEntries);
      toDelete.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  /**
   * Guarda datos en localStorage si está habilitado
   */
  private saveToLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Error al guardar en localStorage:', error);
    }
  }

  /**
   * Recupera datos de localStorage
   */
  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;
      
      const entry = JSON.parse(item) as CacheEntry<T>;
      return this.isValidEntry(entry) ? entry : null;
    } catch (error) {
      console.warn('Error al leer de localStorage:', error);
      return null;
    }
  }

  /**
   * Elimina una entrada de localStorage
   */
  private removeFromLocalStorage(key: string): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Error al eliminar de localStorage:', error);
    }
  }

  /**
   * Obtiene datos del caché
   */
  get<T>(url: string, params?: any): T | null {
    const key = this.generateKey(url, params);
    
    // Intentar obtener de memoria primero
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      return memoryEntry.data;
    }

    // Si no está en memoria, intentar localStorage
    const localEntry = this.getFromLocalStorage<T>(key);
    if (localEntry) {
      // Restaurar en memoria
      this.memoryCache.set(key, localEntry);
      this.enforceSizeLimit();
      return localEntry.data;
    }

    return null;
  }

  /**
   * Almacena datos en el caché
   */
  set<T>(url: string, data: T, ttl?: number, params?: any): void {
    const key = this.generateKey(url, params);
    const now = Date.now();
    const expiry = now + (ttl || this.config.defaultTTL);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiry,
      key
    };

    // Guardar en memoria
    this.memoryCache.set(key, entry);
    this.enforceSizeLimit();
    
    // Guardar en localStorage
    this.saveToLocalStorage(key, entry);
    
    // Limpiar entradas expiradas ocasionalmente
    if (Math.random() < 0.1) {
      this.cleanExpiredEntries();
    }
  }

  /**
   * Elimina una entrada específica del caché
   */
  delete(url: string, params?: any): void {
    const key = this.generateKey(url, params);
    this.memoryCache.delete(key);
    this.removeFromLocalStorage(key);
  }

  /**
   * Invalida caché basado en patrones
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    // Limpiar memoria
    for (const [key] of this.memoryCache.entries()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpiar localStorage
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith('cache_') && regex.test(storageKey.slice(6))) {
          keysToRemove.push(storageKey);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.memoryCache.clear();
    
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): {
    memoryEntries: number;
    memorySize: string;
    localStorageEntries: number;
  } {
    let localStorageEntries = 0;
    
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          localStorageEntries++;
        }
      }
    }

    return {
      memoryEntries: this.memoryCache.size,
      memorySize: `${Math.round(JSON.stringify([...this.memoryCache.values()]).length / 1024)}KB`,
      localStorageEntries
    };
  }
}

// Configuraciones predefinidas para diferentes tipos de datos
export const CACHE_CONFIGS = {
  // Datos que cambian poco (productos, categorías)
  STATIC: {
    defaultTTL: 30 * 60 * 1000, // 30 minutos
    maxMemoryEntries: 50,
    enableLocalStorage: true
  },
  
  // Datos que cambian frecuentemente (stock, precios)
  DYNAMIC: {
    defaultTTL: 2 * 60 * 1000, // 2 minutos
    maxMemoryEntries: 30,
    enableLocalStorage: false
  },
  
  // Datos del usuario
  USER: {
    defaultTTL: 15 * 60 * 1000, // 15 minutos
    maxMemoryEntries: 20,
    enableLocalStorage: true
  },
  
  // Datos de sesión
  SESSION: {
    defaultTTL: 60 * 60 * 1000, // 1 hora
    maxMemoryEntries: 10,
    enableLocalStorage: true
  }
};

// Instancias de caché especializadas
export const staticCache = new CacheManager(CACHE_CONFIGS.STATIC);
export const dynamicCache = new CacheManager(CACHE_CONFIGS.DYNAMIC);
export const userCache = new CacheManager(CACHE_CONFIGS.USER);
export const sessionCache = new CacheManager(CACHE_CONFIGS.SESSION);

// Caché por defecto
export const defaultCache = staticCache;

export default CacheManager; 