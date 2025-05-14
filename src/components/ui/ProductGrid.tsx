import { Producto } from '@/lib/api';
import ProductCard from './ProductCard';

interface ProductGridProps {
  productos: Producto[];
  title?: string;
}

export default function ProductGrid({ productos, title }: ProductGridProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{title || 'Productos'}</h2>
        <p className="text-gray-600 dark:text-gray-400">No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {title && <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{title}</h2>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos.map((producto) => (
          <div key={producto.id_producto} className="h-full">
            <ProductCard producto={producto} />
          </div>
        ))}
      </div>
    </div>
  );
} 