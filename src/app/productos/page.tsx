'use client';

import { useEffect, useState } from 'react';
import { productoApi, Producto } from '@/lib/api';
import ProductGrid from '@/components/ui/ProductGrid';
import { FaSearch, FaFilter } from 'react-icons/fa';

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await productoApi.getAll();
        setProductos(data);
        setFilteredProductos(data);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('No se pudieron cargar los productos. Por favor, intenta nuevamente más tarde.');
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  // Filtrar productos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProductos(productos);
    } else {
      const termLower = searchTerm.toLowerCase();
      const filtered = productos.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(termLower) ||
          producto.descripcion.toLowerCase().includes(termLower)
      );
      setFilteredProductos(filtered);
    }
  }, [searchTerm, productos]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // La búsqueda ya se maneja en el efecto
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500 text-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Catálogo de Productos</h1>
            <p className="text-blue-50 dark:text-blue-100">
              Explora nuestra amplia selección de artículos de tenis de mesa de alta calidad.
            </p>
          </div>
          
          <div className="w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-4 pr-10 py-2 rounded-full bg-white/20 border border-blue-300 dark:border-blue-400 backdrop-blur-sm text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-100 hover:text-white"
                aria-label="Buscar"
              >
                <FaSearch />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 dark:text-red-400 py-8">{error}</div>
        ) : (
          <>
            <ProductGrid 
              productos={filteredProductos} 
              title={searchTerm ? `Resultados para "${searchTerm}"` : undefined}
            />
            
            {filteredProductos.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No se encontraron productos que coincidan con tu búsqueda. Intenta con otros términos.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 