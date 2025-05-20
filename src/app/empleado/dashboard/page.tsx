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

  // Verificar autenticación y rol
  useEffect(() => {
    if (!isLoading) {
      if (!user || !isEmpleado(user) || user.rol_id !== 3) {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  // Cargar productos
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Panel de Vendedor
      </h1>

      <div className="grid gap-8">
        {/* Sección de Inventario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Inventario Actual
          </h2>
          <StockViewer productos={productos} />
        </div>

        {/* Sección de Pedidos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Pedidos Listos para Despacho/Entrega
          </h2>
          <OrderList />
        </div>
      </div>
    </div>
  );
}