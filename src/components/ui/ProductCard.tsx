'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart } from 'react-icons/fa';
import { Producto } from '@/lib/api';
import { useCarrito } from '@/lib/useCarrito';

interface ProductCardProps {
  producto: Producto;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const { agregarProducto } = useCarrito();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    agregarProducto(producto, 1);
    
    // Mostrar animación durante 1 segundo
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagen del producto (placeholder) */}
      <div className="bg-gray-200 dark:bg-gray-700 aspect-square flex items-center justify-center">
        <img
          src={`https://picsum.photos/seed/${producto.id_producto}/300/300`}
          alt={producto.nombre}
          className="object-cover w-full h-full"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white line-clamp-2">
          {producto.nombre}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{producto.descripcion}</p>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-xl font-bold text-blue-700 dark:text-blue-400">${producto.precio.toFixed(2)}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Stock: {producto.stock}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <Link 
            href={`/productos/${producto.id_producto}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            Ver detalles
          </Link>
          
          <button
            onClick={handleAddToCart}
            disabled={isAdding || producto.stock <= 0}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-white ${
              producto.stock <= 0
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : isAdding
                ? 'bg-green-500 dark:bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
            } transition-colors duration-300`}
          >
            <FaShoppingCart />
            <span>{isAdding ? '¡Agregado!' : producto.stock <= 0 ? 'Sin stock' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 