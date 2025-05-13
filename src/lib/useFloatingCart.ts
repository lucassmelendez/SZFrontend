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
    if (cantidadTotal > lastItemCountRef.current) {
      // Actualizamos el estado con setTimeout para evitar actualizaciones durante el renderizado
      setTimeout(() => {
        setShowCartAnimation(true);
      }, 0);
      
      // Resetear animación después de 1.5 segundos
      const timer = setTimeout(() => {
        setShowCartAnimation(false);
      }, 1500);
      
      // Actualizamos la referencia
      lastItemCountRef.current = cantidadTotal;
      
      return () => clearTimeout(timer);
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