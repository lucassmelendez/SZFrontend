'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado } from '@/lib/api';

export default function EmpleadoDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Si no hay usuario o el usuario no es un vendedor (rol 3)
      if (!user || !isEmpleado(user) || user.rol_id !== 3) {
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

  // Si llegamos aquí, sabemos que el usuario es un vendedor
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Vendedor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Mis Ventas</h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-medium">Atención al cliente</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Responder consultas de clientes en el chat de soporte</p>
              <span className="mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                En progreso
              </span>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-medium">Verificación de inventario</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Revisar el stock físico de productos deportivos</p>
              <span className="mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Completada
              </span>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-medium">Preparación de pedidos</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Empaquetar productos para envío</p>
              <span className="mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Pendiente
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Ver órdenes pendientes
            </button>
            <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
              Registrar ventas en tienda
            </button>
            <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
              Consultar inventario
            </button>
            <button className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors">
              Reportar problema
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Órdenes Pendientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Productos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3].map((_, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#ORD-{1000 + index}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">Cliente Ejemplo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 2} productos</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Procesando
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs">
                      Procesar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Mi Horario</h2>
        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => (
            <div key={idx} className="text-center">
              <div className="font-medium mb-2">{day}</div>
              <div className={`p-2 rounded-md ${idx < 5 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {idx < 5 ? '9:00 - 18:00' : 'Libre'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 