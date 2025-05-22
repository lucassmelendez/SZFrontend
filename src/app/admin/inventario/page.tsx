'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado, productoApi, Producto } from '@/lib/api';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi';

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

  const handleEliminarProducto = (id: number) => {
    // Por ahora solo mostramos un mensaje - la funcionalidad se implementará después
    console.log('Eliminar producto:', id);
    alert('Funcionalidad de eliminación en desarrollo');
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
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <FiArrowLeft className="w-5 h-5" />
          Volver
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative flex-1">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select 
                value={categoriaSeleccionada}
                onChange={handleCategoriaChange}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {Object.entries(categoriasMap).map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productos.map((producto) => (
                  <tr key={producto.id_producto} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">#{producto.id_producto}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-xs text-gray-500 md:hidden">{producto.descripcion}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">{producto.descripcion}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{producto.marca}</td>
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-sm">{categoriasMap[producto.categoria_id]}</td>
                    <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm">{producto.peso} kg</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        producto.stock > 10 
                          ? 'bg-green-100 text-green-800'
                          : producto.stock > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {producto.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      ${producto.precio.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditarProducto(producto.id_producto)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEliminarProducto(producto.id_producto)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
              Mostrando {((pagina - 1) * productosPorPagina) + 1} a {Math.min(pagina * productosPorPagina, totalProductos)} de {totalProductos} productos
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina(p => p + 1)}
                disabled={pagina * productosPorPagina >= totalProductos}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
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
