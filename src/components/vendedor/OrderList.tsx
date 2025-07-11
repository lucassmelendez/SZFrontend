'use client';

import { useEffect, useState } from 'react';
import { pedidoApiFast, pedidoProductoApiFast, productoApi, clienteApiFast, type Cliente, type Pedido as ApiPedido, type PedidoProducto } from '@/lib/api';
import { apiCache } from '@/lib/apiCache';
import { FaTruck, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface OrderProduct extends PedidoProducto {
  nombre: string;
}

interface PedidoWithDetails {
  id_pedido: number;
  fecha: string;
  medio_pago_id: number;
  id_estado_envio: number;
  id_estado: number;
  id_cliente: number;
  productos: OrderProduct[];
  cliente: Cliente;
  total: number;
  total_original: number;
  total_descuentos: number;
  aplicar_descuento: boolean;
}

export default function OrderList() {
  const [pedidos, setPedidos] = useState<PedidoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('Vendedor: Iniciando carga optimizada de pedidos...');
      
      // Usar la función optimizada del caché
      const { pedidos, clientes, productos, todosPedidosProductos } = await apiCache.getVendedorDashboardData();
      
      console.log(`Vendedor: Procesando ${pedidos.length} pedidos preparados con datos precargados`);
      
      // Crear mapas para acceso rápido
      const clientesMap = new Map(clientes.map(c => [c.id_cliente, c]));
      
      // Procesar pedidos con datos precargados
      const pedidosConDetalles = pedidos.map((pedido, index) => {
        try {
          // Validar que el pedido tenga un ID
          if (!pedido.id_pedido) return null;

          const pedidoProductos = todosPedidosProductos[index] || [];
          const productosConDetalles = pedidoProductos.map((pp: any) => {
            const producto = productos.get(pp.id_producto);
            return {
              ...pp,
              nombre: producto?.nombre || `Producto #${pp.id_producto}`
            };
          });

          // Calcular totales
          const total_original = productosConDetalles.reduce(
            (acc, curr) => acc + (curr.precio_unitario * curr.cantidad), 
            0
          );
          
          const cantidad_total = productosConDetalles.reduce(
            (acc, curr) => acc + curr.cantidad,
            0
          );
          
          const aplicar_descuento = cantidad_total > 4;
          const total_descuentos = aplicar_descuento ? Math.round(total_original * 0.05) : 0;
          const total = total_original - total_descuentos;

          // Obtener datos del cliente del mapa
          const clienteData = clientesMap.get(pedido.id_cliente);
          if (!clienteData) {
            console.error('Vendedor: No se pudo obtener información del cliente:', pedido.id_cliente);
            return null;
          }

          return {
            ...pedido,
            id_pedido: pedido.id_pedido as number, // We already validated it's not null
            productos: productosConDetalles,
            cliente: clienteData,
            total: total,
            total_original: total_original,
            total_descuentos: total_descuentos,
            aplicar_descuento: aplicar_descuento
          } as PedidoWithDetails;
        } catch (error) {
          console.error('Vendedor: Error procesando pedido:', error);
          return null;
        }
      });

      // Filtrar pedidos nulos y actualizar estado
      const pedidosValidos = pedidosConDetalles.filter((p): p is PedidoWithDetails => p !== null);
      console.log(`Vendedor: ${pedidosValidos.length} pedidos procesados exitosamente`);
      setPedidos(pedidosValidos);
      setError(null);
    } catch (err) {
      console.error('Vendedor: Error al cargar pedidos:', err);
      setError('Error al cargar los pedidos. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: number) => {
    try {
      setUpdatingOrder(orderId);
      await pedidoApiFast.updateEstadoEnvio(orderId, newStatus);
      
      // Invalidar caché del vendedor
      apiCache.invalidateVendedorDashboardCache();
      
      const statusMessages: Record<3 | 4, string> = {
        4: '¡Orden despachada con éxito!',
        3: '¡Orden marcada como entregada!'
      };
      
      toast.success(statusMessages[newStatus as keyof typeof statusMessages] ?? 'Estado actualizado con éxito');
      await fetchOrders();
    } catch (err) {
      console.error('Error al actualizar el pedido:', err);
      toast.error('Error al actualizar el estado del pedido');
    } finally {
      setUpdatingOrder(null);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="p-4 text-gray-700">
        No hay pedidos preparados pendientes de despacho o entrega.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pedidos.map(order => (
        <div
          key={order.id_pedido}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Información del pedido */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg text-gray-800">
                  Pedido #{order.id_pedido}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(order.fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                </span>
              </div>
              
              {/* Información del cliente - versión móvil con iconos */}
              <div className="md:hidden bg-gray-50 p-3 rounded-lg mb-3">
                <h4 className="font-medium text-gray-700 mb-2">Cliente:</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-800 font-medium">
                    {order.cliente.nombre} {order.cliente.apellido}
                  </p>
                  <p className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {order.cliente.direccion}
                  </p>
                  <p className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {order.cliente.telefono}
                  </p>
                </div>
              </div>
              
              {/* Información del cliente - versión desktop */}
              <div className="hidden md:block">
                <p className="text-sm text-gray-600">
                  Cliente: {order.cliente.nombre} {order.cliente.apellido}
                </p>
                <p className="text-sm text-gray-500">
                  Dirección: {order.cliente.direccion}
                </p>
                <p className="text-sm text-gray-500">
                  Teléfono: {order.cliente.telefono}
                </p>
                <p className="text-sm text-gray-500">
                  Fecha: {new Date(order.fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                </p>
              </div>
              
              {/* Lista de productos */}
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Productos:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 bg-gray-50 p-2 rounded-lg">
                  {order.productos.map(producto => (
                    <li key={producto.id_producto} className="flex justify-between py-1 border-b border-gray-100 last:border-0">                      <span>{producto.nombre}</span>
                      <span className="font-medium">x{producto.cantidad}</span>
                    </li>
                  ))}
                </ul>
                {/* Total information */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      Subtotal: ${order.total_original.toLocaleString()}
                    </div>
                    {order.aplicar_descuento && (
                      <div className="text-sm text-green-600">
                        Descuento (5%): -${order.total_descuentos.toLocaleString()}
                      </div>
                    )}
                    <div className="text-base font-medium text-gray-800">
                      Total final: ${order.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-row md:flex-col justify-center items-stretch gap-2 mt-4 md:mt-0">
              <button
                onClick={() => handleUpdateOrderStatus(order.id_pedido, 4)} // Marcar como despachado
                disabled={updatingOrder === order.id_pedido}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors duration-200"
              >
                <FaTruck className="flex-shrink-0" />
                <span className="font-medium">{updatingOrder === order.id_pedido ? 'Procesando...' : 'Despachar'}</span>
              </button>

              <button
                onClick={() => handleUpdateOrderStatus(order.id_pedido, 3)} // Marcar como entregado
                disabled={updatingOrder === order.id_pedido}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors duration-200"
              >
                <FaCheckCircle className="flex-shrink-0" />
                <span className="font-medium">{updatingOrder === order.id_pedido ? 'Procesando...' : 'Entregar'}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
