'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado, productoApi, Producto, api } from '@/lib/api';

const categoriasMap: { [key: string]: string } = {
  '1': 'Paletas',
  '2': 'Bolsos',
  '3': 'Pelotas',
  '4': 'Mallas',
  '5': 'Mesas'
};

export default function AdminInventario() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
    // Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const productosPorPagina = 10;

  // Cargar productos
  useEffect(() => {
    if (!authLoading && (!user || !isEmpleado(user) || user.rol_id !== 2)) {
      router.push('/');
      return;
    }
    
    const cargarProductos = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let productosData: Producto[] = [];        if (searchTerm || categoriaSeleccionada) {
          const response = await fetch('https://sz-backend.vercel.app/api/productos');
          const data = await response.json();
          let allProducts = data.data;
          if (!allProducts || !Array.isArray(allProducts)) {
            throw new Error('Formato de datos no válido');
          }
          
          // Filtrar productos según los criterios
          productosData = allProducts.filter(producto => {
            const matchesSearch = !searchTerm || 
              producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
              producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategoria = !categoriaSeleccionada || 
              producto.categoria_id === parseInt(categoriaSeleccionada);
            
            return matchesSearch && matchesCategoria;
          });
        } else {
          console.log('Obteniendo todos los productos...');
          try {
            const response = await fetch('https://sz-backend.vercel.app/api/productos');
            const data = await response.json();
            console.log('Respuesta completa de la API:', data);
            
            if (!data.data || !Array.isArray(data.data)) {
              throw new Error('Formato de datos no válido');
            }
            
            productosData = data.data;
            console.log('Productos procesados:', productosData);
            if (!productosData.length) {
              console.warn('No se encontraron productos');
            }
          } catch (error: any) {
            console.error('Error detallado:', error);
            throw new Error('Error al obtener productos: ' + (error.message || 'Error desconocido'));
          }
        }

        if (!productosData || !Array.isArray(productosData)) {
          console.error('Datos inválidos:', productosData);
          throw new Error('No se recibieron datos válidos de la API');
        }

        const total = productosData.length;
        console.log('Total de productos:', total);
        
        const inicio = (pagina - 1) * productosPorPagina;
        const fin = inicio + productosPorPagina;
        const productosPaginados = productosData.slice(inicio, fin);
        console.log('Productos paginados:', productosPaginados);

        setProductos(productosPaginados);
        setTotalProductos(total);
      } catch (error: any) {
        console.error('Error al cargar productos:', error);
        setError(error.message || 'No se pudieron cargar los productos. Por favor, intenta nuevamente más tarde.');
        setProductos([]);
        setTotalProductos(0);
      } finally {
        setIsLoading(false);
      }
    };

    cargarProductos();
  }, [user, authLoading, router, pagina, searchTerm, categoriaSeleccionada]);

  // Manejadores de eventos
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPagina(1);
  };

  const handleCategoriaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoriaSeleccionada(event.target.value);
    setPagina(1);
  };

  const handleEditarProducto = (id: number) => {
    // Por ahora solo mostramos un mensaje - la funcionalidad se implementará después
    console.log('Editar producto:', id);
    alert('Funcionalidad de edición en desarrollo');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <button 
          onClick={() => router.push('/admin/dashboard')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Volver
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={handleSearch}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <select 
                value={categoriaSeleccionada}
                onChange={handleCategoriaChange}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Todas las categorías</option>
                {Object.entries(categoriasMap).map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto ring-1 ring-gray-200 dark:ring-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="group px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>ID</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="group px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>Producto</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="group px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>Descripción</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="group px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>Marca</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="group px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>Categoría</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="group px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>Peso (kg)</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="group px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>Stock</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="group px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>Precio</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando productos...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-red-500 dark:text-red-400 mb-2">
                          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setCategoriaSeleccionada('');
                            setPagina(1);
                          }}
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Reintentar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-gray-400 dark:text-gray-500 mb-2">
                          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No se encontraron productos</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Intenta con otros criterios de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  productos.map((producto) => (
                    <tr 
                      key={producto.id_producto} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        PRD-{producto.id_producto.toString().padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {producto.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {producto.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {producto.marca}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {categoriasMap[String(producto.categoria_id)] || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {producto.peso}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          producto.stock > 10
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : producto.stock > 0
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {producto.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${producto.precio.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button 
                          onClick={() => handleEditarProducto(producto.id_producto)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((pagina - 1) * productosPorPagina) + 1}-{Math.min(pagina * productosPorPagina, totalProductos)} de {totalProductos} productos
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPagina(p => p + 1)}
                disabled={pagina * productosPorPagina >= totalProductos}
                className="px-3 py-1 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
