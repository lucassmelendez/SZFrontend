'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { productoApi, Producto } from '@/lib/api';
import ProductGrid from '@/components/ui/ProductGrid';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscarProductos = async () => {
      if (!query) {
        setProductos([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const resultados = await productoApi.search(query);
        setProductos(resultados);
        setLoading(false);
      } catch (error) {
        console.error('Error al buscar productos:', error);
        setError('No se pudieron cargar los resultados. Por favor, intenta nuevamente más tarde.');
        setLoading(false);
      }
    };

    buscarProductos();
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resultados de búsqueda</h1>
            {query && (
              <p className="text-blue-50">
                Mostrando resultados para: "{query}"
              </p>
            )}
          </div>
          <Link 
            href="/productos" 
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors"
          >
            <FaArrowLeft />
            <span>Volver al catálogo</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-8">{error}</div>
      ) : (
        <>
          {productos.length > 0 ? (
            <ProductGrid productos={productos} />
          ) : (
            <div className="text-center py-12">
              <p className="text-2xl font-bold text-gray-800 mb-4">No se encontraron productos</p>
              <p className="text-gray-600 mb-8">
                No encontramos productos que coincidan con "{query}". Intenta con otras palabras clave.
              </p>
              <Link 
                href="/productos" 
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <FaArrowLeft />
                <span>Ver todos los productos</span>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Componente de carga mientras se resuelve la suspensión
function BusquedaLoading() {
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function BuscarProductos() {
  return (
    <Suspense fallback={<BusquedaLoading />}>
      <SearchResults />
    </Suspense>
  );
} 