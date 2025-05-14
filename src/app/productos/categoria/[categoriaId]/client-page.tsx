'use client';

import { useEffect, useState } from 'react';
import { productoApi, Producto } from '@/lib/api';
import ProductGrid from '@/components/ui/ProductGrid';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const categoriasMap = {
  '1': 'Paletas',
  '2': 'Bolsos',
  '3': 'Pelotas',
  '4': 'Mallas',
  '5': 'Mesas'
};

interface CategoriaClientProps {
  categoriaId: string;
}

export function CategoriaClient({ categoriaId }: CategoriaClientProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const id = parseInt(categoriaId, 10);
        if (isNaN(id)) {
          throw new Error('ID de categoría inválido');
        }
        
        const data = await productoApi.getByCategoria(id);
        setProductos(data);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('No se pudieron cargar los productos. Por favor, intenta nuevamente más tarde.');
        setLoading(false);
      }
    };

    fetchProductos();
  }, [categoriaId]);

  const categoriaNombre = categoriasMap[categoriaId as keyof typeof categoriasMap] || 'Categoría';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href="/productos"
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <FaArrowLeft className="mr-2" />
          Volver a productos
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {categoriaNombre}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 dark:text-red-400 py-8">{error}</div>
      ) : (
        <ProductGrid 
          productos={productos}
          title={productos.length === 0 ? `No hay productos en la categoría ${categoriaNombre}` : undefined}
        />
      )}
    </div>
  );
} 