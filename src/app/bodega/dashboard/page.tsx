'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado, productoApi, Producto } from '@/lib/api';
import StockEditor from '@/components/bodega/StockEditor';
import { FaSearch, FaChevronDown } from 'react-icons/fa';
import OrderList from '@/components/bodega/OrderList';
import CambiarContrasenaModal from '@/components/auth/CambiarContrasenaModal';

// Mapa de categorías
const categoriasMap = {
  0: 'Todas',
  1: 'Paletas',
  2: 'Bolsos',
  3: 'Pelotas',
  4: 'Mallas',
  5: 'Mesas',
  6: 'Gomas'
};

export default function BodegaDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number>(0);
  const [showCategorias, setShowCategorias] = useState(false);
  const [mostrarModalCambioContrasena, setMostrarModalCambioContrasena] = useState(false);

  // Cerrar el menú de categorías cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCategorias) {
        const target = event.target as HTMLElement;
        if (!target.closest('.categorias-menu')) {
          setShowCategorias(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategorias]);
  // Verificar autenticación y rol
  useEffect(() => {
    if (!isLoading) {
      if (!user || !isEmpleado(user) || user.rol_id !== 4) {
        router.push('/');
      } else {
        // Verificar si es primer inicio de sesión
        if (isEmpleado(user) && user.primer_login === true) {
          setMostrarModalCambioContrasena(true);
        }
      }
    }
  }, [user, isLoading, router]);

  // Cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await productoApi.getAll();
        // Ordenar productos por stock (ascendente) para mostrar primero los de bajo stock
        const sortedProductos = data.sort((a, b) => a.stock - b.stock);
        setProductos(sortedProductos);
        setFilteredProductos(sortedProductos);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('Error al cargar los productos. Por favor, intenta de nuevo.');
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  // Manejar búsqueda y filtrado de productos
  useEffect(() => {
    let filtered = [...productos];
    
    // Filtrar por categoría si no es "Todas" (0)
    if (selectedCategoria !== 0) {
      filtered = filtered.filter(producto => producto.categoria_id === selectedCategoria);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== '') {
      const termLower = searchTerm.toLowerCase();
      filtered = filtered.filter(producto =>
        producto.nombre.toLowerCase().includes(termLower)
      );
    }
    
    // Ordenar por stock
    filtered = filtered.sort((a, b) => a.stock - b.stock);
    setFilteredProductos(filtered);
  }, [searchTerm, productos, selectedCategoria]);

  // Manejar actualizaciones de stock
  const handleStockUpdate = async (productoId: number, newStock: number) => {
    const updatedProductos = productos.map(p =>
      p.id_producto === productoId ? { ...p, stock: newStock } : p
    ).sort((a, b) => a.stock - b.stock);
    setProductos(updatedProductos);
    
    // La actualización de productos filtrados se maneja automáticamente por el efecto
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calcula estadísticas (usar productos sin filtrar para las estadísticas totales)
  const totalProductos = productos.length;
  const bajoStock = productos.filter(p => p.stock <= 5).length;
  const sinStock = productos.filter(p => p.stock === 0).length;
  return (
    <div className="container mx-auto px-4 py-8">
      {mostrarModalCambioContrasena && <CambiarContrasenaModal />}
      
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Panel de Bodega</h1>
      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total de productos</span>
            <span className="font-bold text-gray-800">{totalProductos}</span>
          </div>
        </div>
        
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Productos bajo stock</span>
            <span className="font-bold text-amber-500">{bajoStock}</span>
          </div>
        </div>
        
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Productos sin stock</span>
            <span className="font-bold text-red-500">{sinStock}</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Órdenes Pendientes</h2>
        <OrderList />
      </div>

      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Gestión de Stock</h2>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium whitespace-nowrap">Filtrar:</span>
              <div className="relative categorias-menu">
                <button
                  onClick={() => setShowCategorias(!showCategorias)}
                  className="flex items-center justify-between w-full md:w-48 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  <span>{categoriasMap[selectedCategoria as keyof typeof categoriasMap]}</span>
                  <FaChevronDown className={`ml-2 transition-transform ${showCategorias ? 'rotate-180' : ''}`} />
                </button>
                
                {showCategorias && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {Object.entries(categoriasMap).map(([id, nombre]) => (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedCategoria(Number(id));
                          setShowCategorias(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                          ${selectedCategoria === Number(id) ? 'bg-gray-100' : ''}`}
                      >
                        {nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full md:w-64 px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaSearch className="absolute left-3 text-gray-400" />
            </div>
          </div>
        </div>
        
        <StockEditor 
          productos={filteredProductos}
          onStockUpdate={handleStockUpdate}
        />
      </div>
    </div>
  );
}