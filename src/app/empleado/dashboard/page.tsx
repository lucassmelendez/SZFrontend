'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado, Producto, productoApi } from '@/lib/api';
import StockViewer from '../../../components/vendedor/StockViewer';
import OrderList from '../../../components/vendedor/OrderList';

export default function EmpleadoDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user || !isEmpleado(user) || user.rol_id !== 3) {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await productoApi.getAll();
        setProductos(data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('Error al cargar los productos. Por favor, intenta de nuevo.');
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        Panel de Vendedor
      </h1>

      {/* Panel de navegación móvil */}
      <div className="md:hidden bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex overflow-x-auto space-x-4 pb-2">
          <a href="#ordenes" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg whitespace-nowrap">
            Pedidos Pendientes
          </a>
          <a href="#inventario" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg whitespace-nowrap">
            Inventario
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="grid gap-6">
        <div id="ordenes" className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="h-6 w-1 bg-blue-500 rounded mr-3"></span>
            Pedidos Listos para Despacho/Entrega
          </h2>
          <OrderList />
        </div>

        <div id="inventario" className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="h-6 w-1 bg-green-500 rounded mr-3"></span>
            Inventario Actual
          </h2>
          <StockViewer productos={productos} />
        </div>
      </div>
    </div>
  );
}