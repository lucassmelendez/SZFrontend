'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart } from 'react-icons/fa';
import { Producto } from '@/lib/api';
import { useCarrito } from '@/lib/useCarrito';
import { useFloatingCartContext } from '@/lib/FloatingCartContext';

interface ProductCardProps {
  producto: Producto;
  compact?: boolean;
}

export default function ProductCard({ producto, compact = false }: ProductCardProps) {
  const { agregarProducto } = useCarrito();
  const { openCart } = useFloatingCartContext();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    
    // Agregar el producto y luego abrir el carrito con un pequeño retraso
    // para asegurar que el estado se haya actualizado
    agregarProducto(producto, 1);
    
    // Esperar un breve momento antes de abrir el carrito para asegurar que
    // el estado del carrito esté actualizado cuando se abra
    setTimeout(() => {
      openCart();
      
      // Mantener el estado de "Agregado" por un momento para feedback visual
      setTimeout(() => {
        setIsAdding(false);
      }, 800);
    }, 200);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Imagen del producto (placeholder) */}
      <div className="bg-gray-200 dark:bg-gray-700 aspect-square flex items-center justify-center">
        <img
          src={`https://picsum.photos/seed/${producto.id_producto}/300/300`}
          alt={producto.nombre}
          className="object-cover w-full h-full"
        />
      </div>
      
      <div className={`${compact ? 'p-3' : 'p-4'} flex-grow flex flex-col`}>
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold mb-2 text-gray-800 dark:text-white line-clamp-2 ${compact ? 'min-h-[2.75rem]' : 'min-h-[3.5rem]'}`}>
          {producto.nombre}
        </h3>
        
        {!compact && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2 flex-grow">{producto.descripcion}</p>
        )}
        
        <div className="flex justify-between items-center mb-2">
          <span className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-blue-700 dark:text-blue-400`}>${Math.round(producto.precio)}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Stock: {producto.stock}</span>
        </div>
        
        <div className={`flex ${compact ? 'flex-row' : 'flex-col sm:flex-row'} gap-2 justify-between items-center mt-auto`}>
          <Link 
            href={`/productos/${producto.id_producto}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            Ver detalle
          </Link>
          
          <button
            onClick={handleAddToCart}
            disabled={isAdding || producto.stock <= 0}
            className={`flex items-center justify-center ${compact ? 'text-sm' : 'text-base'} ${compact ? 'w-auto' : 'w-full sm:w-auto'} space-x-1 px-2 py-1 rounded-full text-white ${
              producto.stock <= 0
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : isAdding
                ? 'bg-green-500 dark:bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
            } transition-colors duration-300`}
          >
            <FaShoppingCart className={compact ? "mr-0" : "mr-1"} />
            {!compact && <span>{isAdding ? '¡Agregado!' : producto.stock <= 0 ? 'Sin stock' : 'Agregar'}</span>}
          </button>
        </div>
      </div>
    </div>
  );
} 