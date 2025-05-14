'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaEye } from 'react-icons/fa';
import { Producto } from '@/lib/api';
import { useCarrito } from '@/lib/useCarrito';
import { useFloatingCartContext } from '@/lib/FloatingCartContext';

interface ProductCardProps {
  producto: Producto;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const { agregarProducto } = useCarrito();
  const { openCart } = useFloatingCartContext();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    // Evitar que el clic se propague a la tarjeta (lo que redireccionaría)
    e.stopPropagation();
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
    <Link href={`/productos/${producto.id_producto}`} className="block h-full">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border border-gray-100 dark:border-gray-700 cursor-pointer">
        {/* Imagen del producto (placeholder) */}
        <div className="relative overflow-hidden group">
          <div className="aspect-square bg-gray-100 dark:bg-gray-700">
            <img
              src={`https://picsum.photos/seed/${producto.id_producto}/400/400`}
              alt={producto.nombre}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          {/* Botón de vista rápida - ya no es necesario porque toda la tarjeta es clickeable */}
        </div>
        
        <div className="p-5 flex-grow flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white line-clamp-2 min-h-[3rem]">
            {producto.nombre}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2 flex-grow">{producto.descripcion}</p>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-blue-700 dark:text-blue-400">${Math.round(producto.precio)}</span>
            <span className={`text-sm px-2 py-1 rounded-full ${producto.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Sin stock'}
            </span>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={isAdding || producto.stock <= 0}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white ${
              producto.stock <= 0
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : isAdding
                ? 'bg-green-500 dark:bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
            } transition-colors duration-300`}
          >
            <FaShoppingCart />
            <span>{isAdding ? '¡Agregado!' : producto.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}</span>
          </button>
        </div>
      </div>
    </Link>
  );
} 