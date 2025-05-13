'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { useFloatingCartContext } from '@/lib/FloatingCartContext';

export default function CarritoPage() {
  const router = useRouter();
  const { openCart } = useFloatingCartContext();

  useEffect(() => {
    // Abre el carrito flotante automáticamente
    openCart();
    
    // Espera un poco antes de redirigir para que el usuario pueda ver el carrito
    const timer = setTimeout(() => {
      router.push('/productos');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [openCart, router]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
        <FaShoppingCart className="text-blue-600 dark:text-blue-400 text-2xl" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
        Ahora tenemos un carrito flotante
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
        Hemos actualizado nuestra experiencia de compra con un carrito flotante más cómodo.
        Estás siendo redirigido a la página de productos...
      </p>
      <Link
        href="/productos"
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
      >
        <FaArrowLeft className="mr-2" />
        Ir a productos
      </Link>
    </div>
  );
} 