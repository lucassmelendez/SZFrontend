'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiCache } from '@/lib/apiCache';

interface CacheContextType {
  // Estado de carga
  isPreloading: boolean;
  
  // Estado de conectividad
  isOnline: boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const useCacheContext = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCacheContext debe ser usado dentro de un CacheProvider');
  }
  return context;
};

interface CacheProviderProps {
  children: ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Precargar datos críticos
  const preloadCriticalData = async () => {
    setIsPreloading(true);
    try {
      await apiCache.preloadCriticalData();
    } catch (error) {
      console.error('Error al precargar datos:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  // Detectar cambios en la conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Precargar datos cuando se recupera la conexión
      preloadCriticalData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    // Agregar event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Precargar datos críticos al iniciar la aplicación
  useEffect(() => {
    if (isOnline) {
      preloadCriticalData();
    }
  }, []);

  const value: CacheContextType = {
    isPreloading,
    isOnline
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export default CacheContext; 