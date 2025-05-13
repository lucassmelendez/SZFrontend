import { useState, useCallback, useEffect, useRef } from 'react';
import { useCarrito } from './useCarrito';

export function useFloatingCart() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCartAnimation, setShowCartAnimation] = useState(false);
  const { cantidadTotal } = useCarrito();

  // Para rastrear si un artículo se agregó recientemente
  const lastItemCountRef = useRef(cantidadTotal);
  
  // Resetear el estado cuando el carrito está vacío
  useEffect(() => {
    // Si el carrito está vacío, resetear referencias
    if (cantidadTotal === 0) {
      lastItemCountRef.current = 0;
      setShowCartAnimation(false);
    }
  }, [cantidadTotal]);
  
  // Inicializar lastItemCount con el valor inicial de cantidadTotal
  useEffect(() => {
    lastItemCountRef.current = cantidadTotal;
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen(prevState => !prevState);
  }, []);

  // Mostrar animación cuando se agrega un nuevo artículo
  useEffect(() => {
    // Solo hacemos esto si cantidadTotal realmente aumentó
    if (cantidadTotal > lastItemCountRef.current) {
      // Actualizamos la referencia primero
      lastItemCountRef.current = cantidadTotal;

      // Establecer la animación con un efecto separado para evitar
      // actualizar durante el renderizado
      const animationTimer = setTimeout(() => {
        setShowCartAnimation(true);
        
        // Resetear animación después de 1.5 segundos
        const resetTimer = setTimeout(() => {
          setShowCartAnimation(false);
        }, 1500);
        
        return () => clearTimeout(resetTimer);
      }, 0);
      
      return () => clearTimeout(animationTimer);
    } else if (cantidadTotal !== lastItemCountRef.current) {
      // Si cantidadTotal cambió pero no aumentó (se eliminaron productos)
      lastItemCountRef.current = cantidadTotal;
    }
  }, [cantidadTotal]);

  return {
    isCartOpen,
    showCartAnimation,
    openCart,
    closeCart,
    toggleCart
  };
} 