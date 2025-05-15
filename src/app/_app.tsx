'use client';

import { ReactNode, useEffect } from 'react';
import { FloatingCartProvider } from '@/lib/FloatingCartContext';
import { iniciarMonitorConexion } from '@/lib/pedidosOffline';

interface AppProviderProps {
  children: ReactNode;
}

export default function AppProvider({ children }: AppProviderProps) {
  // Iniciar monitor de conexión para sincronizar pedidos offline
  useEffect(() => {
    // Solo en el cliente
    if (typeof window === 'undefined') return;
    
    console.log('Iniciando monitor de conexión para sincronizar pedidos offline...');
    const detenerMonitor = iniciarMonitorConexion();
    
    // Limpiar al desmontar
    return () => {
      if (detenerMonitor) {
        detenerMonitor();
        console.log('Monitor de sincronización de pedidos detenido.');
      }
    };
  }, []);
  
  return (
    <FloatingCartProvider>
      {children}
    </FloatingCartProvider>
  );
} 