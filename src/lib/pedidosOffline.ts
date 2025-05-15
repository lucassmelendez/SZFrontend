import { Pedido, PedidoProducto, pedidoApiFast, pedidoProductoApiFast } from './api';
import { CarritoItem } from './useCarrito';

// Clave para almacenar pedidos en localStorage
const PEDIDOS_STORAGE_KEY = 'pedidos_offline';

// Estructura para el pedido offline
export interface PedidoOffline {
  id_pedido: number;
  fecha: string;
  medio_pago_id: number;
  id_estado_envio: number;
  id_estado: number;
  id_cliente: number;
  productos: {
    id_producto: number;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[];
  total: number;
  sincronizado: boolean;
}

// Obtener los pedidos almacenados
export const getPedidosOffline = (): PedidoOffline[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const pedidosJson = localStorage.getItem(PEDIDOS_STORAGE_KEY);
    if (!pedidosJson) return [];
    
    return JSON.parse(pedidosJson);
  } catch (error) {
    console.error('Error al obtener pedidos offline:', error);
    return [];
  }
};

// Guardar un nuevo pedido
export const guardarPedidoOffline = (
  idCliente: number,
  items: CarritoItem[],
  medioPagoId: number = 1,
  estadoEnvioId: number = 2,
  estadoId: number = 2
): PedidoOffline => {
  // Obtener pedidos existentes
  const pedidosExistentes = getPedidosOffline();
  
  // Generar ID único para el pedido (simulado)
  const idPedido = Date.now();
  
  // Crear el nuevo pedido
  const nuevoPedido: PedidoOffline = {
    id_pedido: idPedido,
    fecha: new Date().toISOString(),
    medio_pago_id: medioPagoId,
    id_estado_envio: estadoEnvioId,
    id_estado: estadoId,
    id_cliente: idCliente,
    productos: items.map(item => ({
      id_producto: item.producto.id_producto,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio: item.producto.precio,
      subtotal: item.producto.precio * item.cantidad
    })),
    total: items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0) * 1.19,
    sincronizado: false
  };
  
  // Guardar la lista actualizada
  const pedidosActualizados = [...pedidosExistentes, nuevoPedido];
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidosActualizados));
  }
  
  return nuevoPedido;
};

// Marcar un pedido como sincronizado con el servidor
export const marcarPedidoSincronizado = (idPedido: number): void => {
  const pedidos = getPedidosOffline();
  const pedidosActualizados = pedidos.map(pedido => 
    pedido.id_pedido === idPedido 
      ? { ...pedido, sincronizado: true }
      : pedido
  );
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidosActualizados));
  }
};

// Eliminar un pedido de la lista
export const eliminarPedidoOffline = (idPedido: number): void => {
  const pedidos = getPedidosOffline();
  const pedidosActualizados = pedidos.filter(pedido => pedido.id_pedido !== idPedido);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidosActualizados));
  }
};

// Obtener un pedido específico
export const getPedidoOffline = (idPedido: number): PedidoOffline | null => {
  const pedidos = getPedidosOffline();
  return pedidos.find(pedido => pedido.id_pedido === idPedido) || null;
};

// Convertir un PedidoOffline a formato de API
export const convertirAPedidoApi = (pedidoOffline: PedidoOffline): Pedido => {
  return {
    id_pedido: pedidoOffline.id_pedido,
    fecha: pedidoOffline.fecha,
    medio_pago_id: pedidoOffline.medio_pago_id,
    id_estado_envio: pedidoOffline.id_estado_envio,
    id_estado: pedidoOffline.id_estado,
    id_cliente: pedidoOffline.id_cliente
  };
};

// Convertir productos de un PedidoOffline a formato API
export const convertirAProductosApi = (pedidoOffline: PedidoOffline): PedidoProducto[] => {
  return pedidoOffline.productos.map(producto => ({
    cantidad: producto.cantidad,
    precio_unitario: producto.precio,
    subtotal: producto.subtotal,
    id_pedido: pedidoOffline.id_pedido,
    id_producto: producto.id_producto
  }));
};

// Sincronizar pedidos offline con la API
export const sincronizarPedidosOffline = async (): Promise<{exito: boolean, sincronizados: number, total: number}> => {
  try {
    const pedidosOffline = getPedidosOffline();
    const pedidosNoSincronizados = pedidosOffline.filter(p => !p.sincronizado);
    
    if (pedidosNoSincronizados.length === 0) {
      return { exito: true, sincronizados: 0, total: 0 };
    }
    
    console.log(`Intentando sincronizar ${pedidosNoSincronizados.length} pedidos offline...`);
    
    let sincronizados = 0;
    
    for (const pedidoOffline of pedidosNoSincronizados) {
      try {
        // 1. Convertir a formato de API y crear pedido
        const pedidoApi = convertirAPedidoApi(pedidoOffline);
        const nuevoPedido = await pedidoApiFast.create(pedidoApi);
        
        if (!nuevoPedido || !nuevoPedido.id_pedido) {
          console.error('Error al sincronizar pedido: No se obtuvo un ID de pedido válido');
          continue;
        }
        
        // 2. Agregar productos al pedido creado
        const productosApi = pedidoOffline.productos.map(producto => ({
          cantidad: producto.cantidad,
          precio_unitario: producto.precio,
          subtotal: producto.subtotal,
          id_pedido: nuevoPedido.id_pedido as number,
          id_producto: producto.id_producto
        }));
        
        await pedidoProductoApiFast.addBulk(nuevoPedido.id_pedido, productosApi);
        
        // 3. Marcar como sincronizado y contar
        marcarPedidoSincronizado(pedidoOffline.id_pedido);
        sincronizados++;
        
        console.log(`Pedido ${pedidoOffline.id_pedido} sincronizado correctamente`);
      } catch (error) {
        console.error(`Error al sincronizar pedido ${pedidoOffline.id_pedido}:`, error);
      }
    }
    
    return {
      exito: sincronizados > 0,
      sincronizados,
      total: pedidosNoSincronizados.length
    };
  } catch (error) {
    console.error('Error general al sincronizar pedidos offline:', error);
    return { exito: false, sincronizados: 0, total: 0 };
  }
};

// Iniciar monitor de conectividad para sincronizar pedidos
export const iniciarMonitorConexion = () => {
  if (typeof window === 'undefined') return;
  
  // Verificar si hay pedidos no sincronizados
  const verificarYSincronizar = async () => {
    try {
      const pedidosOffline = getPedidosOffline();
      const hayPedidosNoSincronizados = pedidosOffline.some(p => !p.sincronizado);
      
      if (hayPedidosNoSincronizados && navigator.onLine) {
        console.log('Conexión recuperada y hay pedidos sin sincronizar. Intentando sincronización...');
        const resultado = await sincronizarPedidosOffline();
        console.log('Resultado de sincronización automática:', resultado);
      }
    } catch (error) {
      console.error('Error en verificación automática de sincronización:', error);
    }
  };
  
  // Escuchar eventos de conexión/desconexión
  window.addEventListener('online', verificarYSincronizar);
  
  // Verificar periódicamente (cada 3 minutos)
  const intervalo = setInterval(verificarYSincronizar, 3 * 60 * 1000);
  
  // Devolver función para detener el monitor
  return () => {
    window.removeEventListener('online', verificarYSincronizar);
    clearInterval(intervalo);
  };
}; 