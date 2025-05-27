'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaTimes, FaTrash, FaArrowRight } from 'react-icons/fa';
import { useCarrito } from '@/lib/useCarrito';
import { useRouter } from 'next/navigation';
import Price from '@/components/Price';

interface FloatingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FloatingCart({ isOpen, onClose }: FloatingCartProps) {
  const { items, actualizarCantidad, eliminarProducto, calcularTotal, calcularSubtotal, calcularDescuento } = useCarrito();
  const cartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Handler para eliminar productos
  const handleEliminarProducto = (productoId: number) => {
    eliminarProducto(productoId);
  };

  // Navegar a la página de detalle del producto
  const handleNavigateToProduct = (productoId: number) => {
    onClose(); // Cerrar el carrito
    router.push(`/productos/${productoId}`);
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
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/5 transition-opacity">
      {/* Carrito en desktop - desliza desde la derecha */}
      <div 
        ref={cartRef}
        className="fixed right-0 top-0 md:w-96 w-full h-full bg-white shadow-xl transform transition-transform duration-300 overflow-y-auto md:translate-y-0 flex flex-col"
        style={{ 
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        {/* Cabecera */}
        <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center sticky top-0 z-10 shadow-md">
          <div className="flex items-center">
            <FaShoppingCart className="mr-2" />
            <h2 className="text-lg font-semibold">Carrito</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-blue-200 p-2 rounded-full hover:bg-blue-700 transition-colors"
            aria-label="Cerrar carrito"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-grow overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-5 shadow-inner">
                <FaShoppingCart className="text-gray-400 text-3xl" />
              </div>
              <p className="text-gray-600 font-medium">Tu carrito está vacío</p>
              <p className="text-gray-500 text-sm mt-2">Agrega productos para empezar a comprar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.producto.id_producto} 
                  className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-200"
                >
                  <div className="flex p-3">
                    {/* Imagen clickeable */}
                    <div 
                      className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                      onClick={() => handleNavigateToProduct(item.producto.id_producto)}
                    >
                      <img
                        src={`/productos/${item.producto.id_producto}.webp`}
                        alt={item.producto.nombre}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    
                    {/* Detalles del producto */}
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between">
                        <h3 
                          className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 line-clamp-2"
                          onClick={() => handleNavigateToProduct(item.producto.id_producto)}
                        >
                          {item.producto.nombre}
                        </h3>
                        <button
                          onClick={() => handleEliminarProducto(item.producto.id_producto)}
                          className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-100 rounded-full transition-colors -mt-1 -mr-1"
                          title="Eliminar"
                          aria-label={`Eliminar ${item.producto.nombre} del carrito`}
                          type="button"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                      <p 
                        className="text-sm font-medium mt-1 cursor-pointer"
                        onClick={() => handleNavigateToProduct(item.producto.id_producto)}
                      >
                        <Price amount={Math.round(item.producto.precio)} size="sm" />
                      </p>
                      
                      {/* Línea separadora */}
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                          <button
                            onClick={() => actualizarCantidad(item.producto.id_producto, item.cantidad - 1)}
                            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 text-xs font-medium min-w-[20px] text-center">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => actualizarCantidad(item.producto.id_producto, item.cantidad + 1)}
                            disabled={item.cantidad >= item.producto.stock}
                            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <span 
                          className="font-semibold text-right cursor-pointer"
                          onClick={() => handleNavigateToProduct(item.producto.id_producto)}
                        >
                          <Price amount={Math.round(item.producto.precio * item.cantidad)} size="sm" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con resumen y botón de checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 bg-white sticky bottom-0 shadow-inner p-4">
            <div className="mb-4 bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Subtotal (19% IVA incluido):</span>
                <span className="font-medium text-gray-900">
                  <Price amount={Math.round(calcularSubtotal())} size="sm" />
                </span>
              </div>
              {calcularDescuento() > 0 && (
                <div className="flex justify-between text-sm mb-2 text-green-600">
                  <span>Descuento (5% por más de 4 productos):</span>
                  <span>-<Price amount={Math.round(calcularSubtotal() * calcularDescuento())} size="sm" /></span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-800">Total:</span>
                <span className="text-blue-600">
                  <Price amount={Math.round(calcularTotal())} size="sm" />
                </span>
              </div>
            </div>
            
            <Link
              href="/checkout"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors shadow-sm hover:shadow"
              onClick={onClose}
            >
              <span>Proceder al pago</span>
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}