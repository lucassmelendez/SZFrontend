'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaEye } from 'react-icons/fa';
import { Producto, isEmpleado } from '@/lib/api';
import { useCarrito } from '@/lib/useCarrito';
import { useFloatingCartContext } from '@/lib/FloatingCartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

interface ProductCardProps {
  producto: Producto;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const { agregarProducto } = useCarrito();
  const { openCart } = useFloatingCartContext();
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleCardClick = () => {
    router.push(`/productos/${producto.id_producto}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    // Detener la propagación y prevenir el comportamiento por defecto
    e.stopPropagation();
    e.preventDefault();
    
    setIsAdding(true);
    
    // Agregar el producto pero sin actualizar el estado de UI inmediatamente
    // para evitar modificar el estado de FloatingCart durante el renderizado
    const timer1 = setTimeout(() => {
      agregarProducto(producto, 1);
      
      // Esperar un breve momento antes de abrir el carrito
      const timer2 = setTimeout(() => {
        openCart();
        
        // Restablecer el estado visual
        const timer3 = setTimeout(() => {
          setIsAdding(false);
        }, 800);
      }, 200);
    }, 0);
    
    // Limpieza de timers si el componente se desmonta
    return () => {
      clearTimeout(timer1);
    };
  };

  // Verificar si el usuario es un empleado
  const isUserEmpleado = user && isEmpleado(user);

  return (
    <div onClick={handleCardClick} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border border-gray-100 cursor-pointer">
      {/* Imagen del producto (placeholder) */}
      <div className="relative overflow-hidden group">
        <div className="aspect-square bg-gray-100">
          <img
            src={`/productos/${producto.id_producto}.webp`}
            alt={producto.nombre}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 line-clamp-2 min-h-[3rem]">
          {producto.nombre}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">{producto.descripcion}</p>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-blue-700">${Math.round(producto.precio)}</span>          <span className={`text-sm px-2 py-1 rounded-full ${
            producto.stock === 0
              ? 'bg-red-100 text-red-500'
              : producto.stock <= 5
              ? 'bg-yellow-100 text-yellow-500'
              : 'bg-green-100 text-green-500'
          }`}>
            {producto.stock === 0 ? 'Sin stock' : `Stock: ${producto.stock}`}
          </span>
        </div>
        
        {/* Botón de agregar al carrito (solo visible para clientes) */}
        {!isUserEmpleado && (
          <button
            onClick={handleAddToCart}
            disabled={isAdding || producto.stock <= 0}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white ${
              producto.stock <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : isAdding
                ? 'bg-green-500'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-300`}
          >
            <FaShoppingCart />
            <span>{isAdding ? '¡Agregado!' : producto.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}</span>
          </button>
        )}
      </div>
    </div>
  );
} 