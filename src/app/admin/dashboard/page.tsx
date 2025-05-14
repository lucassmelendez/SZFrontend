'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado } from '@/lib/api';

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Si no hay usuario o el usuario no es un empleado administrador (rol 2)
      if (!user || !isEmpleado(user) || user.rol_id !== 2) {
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

  // Si llegamos aquí, sabemos que el usuario es un administrador
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Ventas totales</span>
              <span className="font-bold">$24,568</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Clientes nuevos</span>
              <span className="font-bold">156</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Órdenes pendientes</span>
              <span className="font-bold">23</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Productos</h2>
          <div className="space-y-2">
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Ver inventario
            </button>
            <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
              Añadir producto
            </button>
            <button className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors">
              Actualizar precios
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Usuarios</h2>
          <div className="space-y-2">
            <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
              Ver clientes
            </button>
            <button className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
              Ver empleados
            </button>
            <button className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors">
              Añadir empleado
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Órdenes Recientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#ORD-{1000 + index}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">Cliente Ejemplo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date().toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${Math.floor(Math.random() * 1000)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completada
                    </span>
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