'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaTimes, FaTrash, FaArrowRight } from 'react-icons/fa';
import { useCarrito } from '@/lib/useCarrito';

interface FloatingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FloatingCart({ isOpen, onClose }: FloatingCartProps) {
  const { items, actualizarCantidad, eliminarProducto, calcularTotal } = useCarrito();
  const cartRef = useRef<HTMLDivElement>(null);
  const lastItemRef = useRef<number | null>(null);
  
  // Guarda el último artículo agregado para efecto visual
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);
  
  // Resetear lastItemRef cuando el carrito está vacío
  useEffect(() => {
    if (items.length === 0) {
      lastItemRef.current = null;
      setLastAddedId(null);
    }
  }, [items]);
  
  // Detectar cuando se agrega un nuevo artículo para efectos visuales
  useEffect(() => {
    // Solo actualizamos el estado si el carrito está abierto y hay items
    if (isOpen && items.length > 0) {
      const lastItem = items[items.length - 1];
      const lastItemId = lastItem.producto.id_producto;
      
      // Solo establecer el lastAddedId si cambió el último item
      if (lastItemRef.current !== lastItemId) {
        lastItemRef.current = lastItemId;
        
        // Usar setTimeout para evitar actualizar durante el renderizado
        setTimeout(() => {
          setLastAddedId(lastItemId);
        }, 0);
        
        // Eliminar el resaltado después de 2 segundos
        const timer = setTimeout(() => {
          setLastAddedId(null);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, items]);

  // Handler para eliminar productos
  const handleEliminarProducto = (productoId: number) => {
    // Si estamos eliminando el último producto resaltado, limpiar la referencia
    if (lastAddedId === productoId) {
      setLastAddedId(null);
    }
    eliminarProducto(productoId);
  };

  // Cerrar carrito al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevenir scroll cuando el carrito está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-transparent transition-opacity">
      {/* Carrito en desktop - desliza desde la derecha */}
      <div 
        ref={cartRef}
        className="fixed right-0 top-0 md:w-96 w-full h-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 overflow-y-auto md:translate-y-0 flex flex-col"
        style={{ 
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        {/* Cabecera */}
        <div className="px-6 py-4 bg-blue-700 dark:bg-blue-900 text-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <FaShoppingCart className="mr-2" />
            <h2 className="text-lg font-semibold">Carrito</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-blue-200"
            aria-label="Cerrar carrito"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-grow overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <FaShoppingCart className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-600 dark:text-gray-300">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.producto.id_producto} 
                  className={`flex border-b pb-4 dark:border-gray-700 ${
                    lastAddedId === item.producto.id_producto ? 'animate-pulse-once bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  {/* Imagen */}
                  <div className="h-16 w-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded">
                    <img
                      src={`https://picsum.photos/seed/${item.producto.id_producto}/100/100`}
                      alt={item.producto.nombre}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  {/* Detalles */}
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {item.producto.nombre}
                      </h3>
                      <button
                        onClick={() => handleEliminarProducto(item.producto.id_producto)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        title="Eliminar"
                        aria-label={`Eliminar ${item.producto.nombre} del carrito`}
                        type="button"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      ${Math.round(item.producto.precio)} x {item.cantidad}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                        <button
                          onClick={() => actualizarCantidad(item.producto.id_producto, item.cantidad - 1)}
                          className="px-2 py-1 text-xs border-r border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 text-xs">{item.cantidad}</span>
                        <button
                          onClick={() => actualizarCantidad(item.producto.id_producto, item.cantidad + 1)}
                          disabled={item.cantidad >= item.producto.stock}
                          className="px-2 py-1 text-xs border-l border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${Math.round(item.producto.precio * item.cantidad)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con resumen y botón de checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 sticky bottom-0">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">${Math.round(calcularTotal())}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Impuestos (19%):</span>
                <span className="font-medium text-gray-900 dark:text-white">${Math.round(calcularTotal() * 0.19)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-800 dark:text-gray-200">Total:</span>
                <span className="text-gray-900 dark:text-white">${Math.round(calcularTotal() * 1.19)}</span>
              </div>
            </div>
            
            <Link
              href="/checkout"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center transition-colors"
              onClick={onClose}
            >
              <span>Ir al Checkout</span>
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 