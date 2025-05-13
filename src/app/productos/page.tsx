'use client';

import { useEffect, useState } from 'react';
import { productoApi, Producto } from '@/lib/api';
import ProductGrid from '@/components/ui/ProductGrid';
import { FaSearch } from 'react-icons/fa';

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
    <div>
      <div className="bg-blue-700 text-white rounded-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-4">Catálogo de Productos</h1>
        <p className="mb-6">
          Explora nuestra amplia selección de artículos de tenis de mesa de alta calidad.
        </p>
      </div>

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
  );
} 