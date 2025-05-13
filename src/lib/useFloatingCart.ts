import { useState, useCallback, useEffect } from 'react';
import { useCarrito } from './useCarrito';

export function useFloatingCart() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCartAnimation, setShowCartAnimation] = useState(false);
  const { cantidadTotal } = useCarrito();

  // Para rastrear si un artículo se agregó recientemente
  const [lastItemCount, setLastItemCount] = useState(cantidadTotal);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen(prevState => !prevState);
  }, []);

  // Mostrar animación y abrir carrito cuando se agrega un nuevo artículo
  useEffect(() => {
    if (cantidadTotal > lastItemCount) {
      setShowCartAnimation(true);
      
      // Abrir carrito automáticamente cuando se agrega un producto
      setIsCartOpen(true);
      
      // Resetear animación después de 1.5 segundos
      const timer = setTimeout(() => {
        setShowCartAnimation(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    setLastItemCount(cantidadTotal);
  }, [cantidadTotal, lastItemCount]);

  return {
    isCartOpen,
    showCartAnimation,
    openCart,
    closeCart,
    toggleCart
  };
} 