import { useState, useEffect, useCallback } from 'react';
import { apiCache } from '@/lib/apiCache';
import { Producto } from '@/lib/api';

interface UseProductCacheOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number;
}

// Hook para obtener todos los productos
export function useProductos(options: UseProductCacheOptions = {}) {
  const { enabled = true, refetchOnMount = false, staleTime } = options;
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const cacheOptions = staleTime ? { ttl: staleTime } : {};
      const productos = await apiCache.getProductos(cacheOptions);
      setData(productos);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [enabled, staleTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook para obtener un producto por ID
export function useProducto(id: number | null, options: UseProductCacheOptions = {}) {
  const { enabled = true, staleTime } = options;
  const [data, setData] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(enabled && id !== null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !id) return;

    try {
      setLoading(true);
      setError(null);
      const cacheOptions = staleTime ? { ttl: staleTime } : {};
      const producto = await apiCache.getProductoById(id, cacheOptions);
      setData(producto);
    } catch (err) {
      console.error('Error al cargar producto:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar producto');
    } finally {
      setLoading(false);
    }
  }, [id, enabled, staleTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook para buscar productos
export function useSearchProductos(query: string, options: UseProductCacheOptions = {}) {
  const { enabled = true, staleTime } = options;
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(enabled && query.length > 0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !query.trim()) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cacheOptions = staleTime ? { ttl: staleTime, cacheType: 'dynamic' as const } : { cacheType: 'dynamic' as const };
      const productos = await apiCache.searchProductos(query, cacheOptions);
      setData(productos);
    } catch (err) {
      console.error('Error al buscar productos:', err);
      setError(err instanceof Error ? err.message : 'Error al buscar productos');
    } finally {
      setLoading(false);
    }
  }, [query, enabled, staleTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook para obtener productos por categoría
export function useProductosByCategoria(categoriaId: number | null, options: UseProductCacheOptions = {}) {
  const { enabled = true, staleTime } = options;
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(enabled && categoriaId !== null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !categoriaId) return;

    try {
      setLoading(true);
      setError(null);
      const cacheOptions = staleTime ? { ttl: staleTime } : {};
      const productos = await apiCache.getProductosByCategoria(categoriaId, cacheOptions);
      setData(productos);
    } catch (err) {
      console.error('Error al cargar productos por categoría:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [categoriaId, enabled, staleTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook para obtener productos más vendidos
export function useProductosMasVendidos(limit: number = 15, options: UseProductCacheOptions = {}) {
  const { enabled = true, staleTime } = options;
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const cacheOptions = staleTime ? { ttl: staleTime, cacheType: 'dynamic' as const } : { cacheType: 'dynamic' as const };
      const productos = await apiCache.getProductosMasVendidos(limit, cacheOptions);
      setData(productos);
    } catch (err) {
      console.error('Error al cargar productos más vendidos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos más vendidos');
    } finally {
      setLoading(false);
    }
  }, [limit, enabled, staleTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook para obtener productos relacionados
export function useProductosRelacionados(categoriaId: number | null, excludeId?: number, limit: number = 4, options: UseProductCacheOptions = {}) {
  const { enabled = true, staleTime } = options;
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(enabled && categoriaId !== null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !categoriaId) return;

    try {
      setLoading(true);
      setError(null);
      const cacheOptions = staleTime ? { ttl: staleTime } : {};
      const productos = await apiCache.getProductosRelacionados(categoriaId, excludeId, limit, cacheOptions);
      setData(productos);
    } catch (err) {
      console.error('Error al cargar productos relacionados:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos relacionados');
    } finally {
      setLoading(false);
    }
  }, [categoriaId, excludeId, limit, enabled, staleTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook para obtener productos destacados
export function useProductosDestacados(limit: number = 8, options: UseProductCacheOptions = {}) {
  const { enabled = true, staleTime } = options;
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const cacheOptions = staleTime ? { ttl: staleTime } : {};
      const productos = await apiCache.getProductosDestacados(limit, cacheOptions);
      setData(productos);
    } catch (err) {
      console.error('Error al cargar productos destacados:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos destacados');
    } finally {
      setLoading(false);
    }
  }, [limit, enabled, staleTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
} 