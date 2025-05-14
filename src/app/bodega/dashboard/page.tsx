'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado } from '@/lib/api';

export default function BodegaDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Si no hay usuario o el usuario no es un bodeguero (rol 4)
      if (!user || !isEmpleado(user) || user.rol_id !== 4) {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si llegamos aquí, sabemos que el usuario es un bodeguero
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Bodega</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Estadísticas de Stock</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Productos en stock</span>
              <span className="font-bold">2,356</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Productos bajo stock mínimo</span>
              <span className="font-bold text-red-500">18</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Órdenes pendientes</span>
              <span className="font-bold">12</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Ver inventario completo
            </button>
            <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
              Recibir mercadería
            </button>
            <button className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors">
              Preparar pedidos
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Notificaciones</h2>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
              <p className="font-medium">Stock bajo: Zapatillas Running T45</p>
              <p className="text-sm">Quedan solo 3 unidades</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md">
              <p className="font-medium">Pedido pendiente #1045</p>
              <p className="text-sm">Esperando confirmación desde hace 2 días</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
              <p className="font-medium">Recepción programada</p>
              <p className="text-sm">Mañana 10:00 AM - Proveedor Deportes XYZ</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Productos con bajo stock</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { id: 1, nombre: 'Zapatillas Running T45', actual: 3, minimo: 10 },
                { id: 2, nombre: 'Balón de Fútbol Pro', actual: 5, minimo: 15 },
                { id: 3, nombre: 'Raqueta de Tenis Premium', actual: 2, minimo: 5 },
                { id: 4, nombre: 'Set de Pesas 10kg', actual: 4, minimo: 8 },
                { id: 5, nombre: 'Traje de Baño Competición', actual: 6, minimo: 12 }
              ].map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{item.actual}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.minimo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs">
                      Solicitar stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 