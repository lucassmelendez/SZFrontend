import { useState, useEffect } from 'react';
import { Producto } from './api';

// Interfaz para los elementos del carrito
export interface CarritoItem {
  producto: Producto;
  cantidad: number;
}

export function useCarrito() {
  const [items, setItems] = useState<CarritoItem[]>([]);
  
  // Cargar el carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCarrito = localStorage.getItem('carrito');
    if (savedCarrito) {
      try {
        setItems(JSON.parse(savedCarrito));
      } catch (error) {
        console.error('Error al cargar el carrito desde localStorage:', error);
        localStorage.removeItem('carrito');
      }
    }
  }, []);
  
  // Guardar cambios en localStorage
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('carrito', JSON.stringify(items));
    } else {
      localStorage.removeItem('carrito');
    }
  }, [items]);
  
  // Agregar un producto al carrito
  const agregarProducto = (producto: Producto, cantidad = 1) => {
    setItems(prevItems => {
      const itemExistente = prevItems.find(item => item.producto.id_producto === producto.id_producto);
      
      if (itemExistente) {
        // Actualizar cantidad si el producto ya existe
        return prevItems.map(item => 
          item.producto.id_producto === producto.id_producto 
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        // Agregar nuevo producto
        return [...prevItems, { producto, cantidad }];
      }
    });
  };
  
  // Actualizar cantidad de un producto
  const actualizarCantidad = (productoId: number, cantidad: number) => {
    setItems(prevItems => {
      if (cantidad <= 0) {
        return prevItems.filter(item => item.producto.id_producto !== productoId);
      }
      
      return prevItems.map(item => 
        item.producto.id_producto === productoId 
          ? { ...item, cantidad }
          : item
      );
    });
  };
  
  // Eliminar un producto del carrito
  const eliminarProducto = (productoId: number) => {
    setItems(prevItems => prevItems.filter(item => item.producto.id_producto !== productoId));
  };
  
  // Limpiar todo el carrito
  const limpiarCarrito = () => {
    setItems([]);
    localStorage.removeItem('carrito');
  };
  
  // Calcular el total del carrito
  const calcularTotal = () => {
    return items.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
  };
  
  // Calcular el número total de artículos
  const cantidadTotal = items.reduce((total, item) => total + item.cantidad, 0);
  
  return {
    items,
    agregarProducto,
    actualizarCantidad,
    eliminarProducto,
    limpiarCarrito,
    calcularTotal,
    cantidadTotal
  };
} 