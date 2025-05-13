import { useState, useEffect } from 'react';
import { Producto } from './api';

// Interfaz para los elementos del carrito
export interface CarritoItem {
  producto: Producto;
  cantidad: number;
}

// Crear un evento personalizado para sincronizar el carrito
const CARRITO_UPDATED_EVENT = 'carritoUpdated';

// Función para disparar el evento de actualización
const notifyCarritoUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CARRITO_UPDATED_EVENT));
  }
};

// Función para limpiar el carrito en localStorage
const clearCartFromStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('carrito');
  }
};

export function useCarrito() {
  const [items, setItems] = useState<CarritoItem[]>([]);
  
  // Cargar el carrito desde localStorage al iniciar
  useEffect(() => {
    const loadCartFromStorage = () => {
      const savedCarrito = localStorage.getItem('carrito');
      if (savedCarrito) {
        try {
          const parsedItems = JSON.parse(savedCarrito);
          // Verificar que sea un array válido y no esté vacío
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            setItems(parsedItems);
          } else {
            // Si está vacío, eliminar del localStorage
            clearCartFromStorage();
            setItems([]);
          }
        } catch (error) {
          console.error('Error al cargar el carrito desde localStorage:', error);
          clearCartFromStorage();
          setItems([]);
        }
      } else {
        setItems([]);
      }
    };

    // Cargar inicialmente
    loadCartFromStorage();
    
    // También cargar cuando se actualice el carrito desde otro componente
    window.addEventListener(CARRITO_UPDATED_EVENT, loadCartFromStorage);
    
    return () => {
      window.removeEventListener(CARRITO_UPDATED_EVENT, loadCartFromStorage);
    };
  }, []);
  
  // Guardar cambios en localStorage
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('carrito', JSON.stringify(items));
    } else {
      clearCartFromStorage();
    }
  }, [items]);
  
  // Agregar un producto al carrito
  const agregarProducto = (producto: Producto, cantidad = 1) => {
    setItems(prevItems => {
      const itemExistente = prevItems.find(item => item.producto.id_producto === producto.id_producto);
      
      let newItems;
      if (itemExistente) {
        // Actualizar cantidad si el producto ya existe
        newItems = prevItems.map(item => 
          item.producto.id_producto === producto.id_producto 
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        // Agregar nuevo producto
        newItems = [...prevItems, { producto, cantidad }];
      }
      
      // Guardar el nuevo estado en localStorage inmediatamente
      if (newItems.length > 0) {
        localStorage.setItem('carrito', JSON.stringify(newItems));
      }
      
      // Notificar a otros componentes
      notifyCarritoUpdated();
      
      return newItems;
    });
  };
  
  // Actualizar cantidad de un producto
  const actualizarCantidad = (productoId: number, cantidad: number) => {
    setItems(prevItems => {
      let newItems;
      if (cantidad <= 0) {
        newItems = prevItems.filter(item => item.producto.id_producto !== productoId);
      } else {
        newItems = prevItems.map(item => 
          item.producto.id_producto === productoId 
            ? { ...item, cantidad }
            : item
        );
      }
      
      // Guardar en localStorage inmediatamente
      if (newItems.length > 0) {
        localStorage.setItem('carrito', JSON.stringify(newItems));
      } else {
        clearCartFromStorage();
      }
      
      // Notificar a otros componentes
      notifyCarritoUpdated();
      
      return newItems;
    });
  };
  
  // Eliminar un producto del carrito
  const eliminarProducto = (productoId: number) => {
    setItems(prevItems => {
      // Obtener nuevos items filtrando el producto a eliminar
      const newItems = prevItems.filter(item => item.producto.id_producto !== productoId);
      
      // Manejar específicamente el caso donde el carrito queda vacío
      if (newItems.length === 0) {
        // Asegurarse de que se limpie el localStorage
        clearCartFromStorage();
        console.log('Carrito vacío, localStorage limpiado');
      } else {
        // Si aún hay elementos, guardar en localStorage
        localStorage.setItem('carrito', JSON.stringify(newItems));
      }
      
      // Notificar a otros componentes inmediatamente
      setTimeout(() => {
        notifyCarritoUpdated();
      }, 0);
      
      return newItems;
    });
  };
  
  // Limpiar todo el carrito
  const limpiarCarrito = () => {
    setItems([]);
    clearCartFromStorage();
    notifyCarritoUpdated();
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