import { useState, useEffect } from 'react';
import { Producto } from './api';

// Interfaz para los elementos del carrito
export interface CarritoItem {
  producto: Producto;
  cantidad: number;
}

// Crear un evento personalizado para sincronizar el carrito
const CARRITO_UPDATED_EVENT = 'carritoUpdated';

// Clave para almacenar el carrito en localStorage
const CARRITO_STORAGE_KEY = 'carrito';

// Función para disparar el evento de actualización
const notifyCarritoUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CARRITO_UPDATED_EVENT));
  }
};

// Función para limpiar el carrito en localStorage
const clearCartFromStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CARRITO_STORAGE_KEY);
  }
};

// Función para obtener el carrito desde localStorage
const getCartFromStorage = (): CarritoItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedCarrito = localStorage.getItem(CARRITO_STORAGE_KEY);
    if (!savedCarrito) return [];
    
    const parsedItems = JSON.parse(savedCarrito);
    if (!Array.isArray(parsedItems)) return [];
    
    return parsedItems;
  } catch (error) {
    console.error('Error al leer el carrito desde localStorage:', error);
    return [];
  }
};

// Función para guardar el carrito en localStorage
const saveCartToStorage = (items: CarritoItem[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    if (items.length > 0) {
      localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(items));
    } else {
      clearCartFromStorage();
    }
  } catch (error) {
    console.error('Error al guardar el carrito en localStorage:', error);
  }
};

export function useCarrito() {
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  
  // Cargar el carrito desde localStorage al iniciar
  useEffect(() => {
    const loadCartFromStorage = () => {
      const cartItems = getCartFromStorage();
      setItems(cartItems);
      setInitialized(true);
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
    if (!initialized) return;
    
    saveCartToStorage(items);
  }, [items, initialized]);
  
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
      saveCartToStorage(newItems);
      
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
      saveCartToStorage(newItems);
      
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
      saveCartToStorage(newItems);
      
      // Log para depuración
      if (newItems.length === 0) {
        console.log('Carrito vacío, localStorage limpiado');
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