'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado } from '@/lib/api';

export default function ContabilidadDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Si no hay usuario o el usuario no es un contador (rol 5)
      if (!user || !isEmpleado(user) || user.rol_id !== 5) {
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

  // Si llegamos aquí, sabemos que el usuario es un contador
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Contabilidad</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Resumen Financiero</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Ingresos (mes actual)</span>
              <span className="font-bold text-green-600">$183,459</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Gastos (mes actual)</span>
              <span className="font-bold text-red-500">$98,726</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Balance neto</span>
              <span className="font-bold text-blue-600">$84,733</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Ver informe mensual
            </button>
            <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
              Registrar transacción
            </button>
            <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
              Preparar declaraciones
            </button>
            <button className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors">
              Gestionar facturas
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Fechas Importantes</h2>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
              <p className="font-medium">Declaración de IVA</p>
              <p className="text-sm">Vence en 5 días</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md">
              <p className="font-medium">Pago de nómina</p>
              <p className="text-sm">Programado para el 30/05/2023</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md">
              <p className="font-medium">Cierre fiscal</p>
              <p className="text-sm">Faltan 45 días</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Últimas Transacciones</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { id: 1, fecha: '15/05/2023', desc: 'Venta al por mayor - Deportes Pro', monto: 15690, tipo: 'ingreso' },
                { id: 2, fecha: '14/05/2023', desc: 'Pago a proveedor - Artículos Deportivos', monto: 8500, tipo: 'gasto' },
                { id: 3, fecha: '12/05/2023', desc: 'Venta en tienda - Día del Deporte', monto: 12345, tipo: 'ingreso' },
                { id: 4, fecha: '10/05/2023', desc: 'Servicios públicos - Mayo', monto: 2300, tipo: 'gasto' },
                { id: 5, fecha: '08/05/2023', desc: 'Suscripciones software', monto: 1850, tipo: 'gasto' }
              ].map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.desc}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    item.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${item.monto.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.tipo === 'ingreso' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Distribución de Gastos</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>Aquí iría un gráfico circular mostrando la distribución de gastos</p>
              <p className="text-sm mt-2">Inventario: 45%</p>
              <p className="text-sm">Personal: 30%</p>
              <p className="text-sm">Marketing: 15%</p>
              <p className="text-sm">Otros: 10%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Cuentas por Cobrar</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Total pendiente</span>
              <span className="font-bold">$24,350</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Vencidas</span>
              <span className="font-bold text-red-500">$8,200</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Por vencer</span>
              <span className="font-bold text-yellow-500">$16,150</span>
            </div>
            <button className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Ver detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 