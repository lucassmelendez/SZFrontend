'use client';

import { useEffect, useState } from 'react';
import { pedidoApiFast, pedidoProductoApiFast, productoApi, clienteApiFast, type Cliente, type Pedido as ApiPedido, type PedidoProducto } from '@/lib/api';
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
    try {      const allPedidos = await pedidoApiFast.getAll();
      // Filtrar pedidos preparados (id_estado_envio === 1)
      const pedidosListos = allPedidos.filter((pedido): pedido is ApiPedido => 
        pedido.id_pedido != null && pedido.id_estado_envio === 1 && pedido.id_estado === 1
      );
      
      const pedidosConDetalles = await Promise.all(
        pedidosListos.map(async (pedido): Promise<PedidoWithDetails | null> => {
          try {
            // Validar que el pedido tenga un ID
            if (!pedido.id_pedido) return null;

            // Obtener productos y detalles
            const pedidoProductos = await pedidoProductoApiFast.getByPedido(pedido.id_pedido);
            const productosConDetalles = await Promise.all(
              pedidoProductos.map(async (pp) => {
                const producto = await productoApi.getById(pp.id_producto);
                return {
                  ...pp,
                  nombre: producto.nombre
                };
              })
            );

            // Obtener datos del cliente
            let clienteData: Cliente | null = null;
            if (pedido.cliente && 'id_cliente' in pedido.cliente) {
              clienteData = pedido.cliente as Cliente;
            } else {
              const clienteFetched = await clienteApiFast.getById(pedido.id_cliente);
              if (!clienteFetched) {
                console.error('No se pudo obtener la información del cliente:', pedido.id_cliente);
                return null;
              }
              clienteData = clienteFetched;
            }            return {
              ...pedido,
              id_pedido: pedido.id_pedido as number, // We already validated it's not null
              productos: productosConDetalles,
              cliente: clienteData
            } as PedidoWithDetails;
          } catch (error) {
            console.error('Error procesando pedido:', error);
            return null;
          }
        })
      );

      // Filtrar pedidos nulos y actualizar estado
      setPedidos(pedidosConDetalles.filter((p): p is PedidoWithDetails => p !== null));
      setError(null);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError('Error al cargar los pedidos. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: number) => {
    try {
      setUpdatingOrder(orderId);
      await pedidoApiFast.updateEstadoEnvio(orderId, newStatus);        const statusMessages: Record<3 | 4, string> = {
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
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
        {error}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="p-4 text-gray-700 dark:text-gray-300">
        No hay pedidos preparados pendientes de despacho o entrega.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pedidos.map(order => (
        <div
          key={order.id_pedido}
          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 shadow-sm"
        >
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Información del pedido */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                Pedido #{order.id_pedido}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Cliente: {order.cliente.nombre} {order.cliente.apellido}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dirección: {order.cliente.direccion}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Teléfono: {order.cliente.telefono}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fecha: {new Date(order.fecha).toLocaleDateString()}
              </p>
              
              {/* Lista de productos */}
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Productos:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {order.productos.map(producto => (
                    <li key={producto.id_producto}>
                      {producto.cantidad}x {producto.nombre}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex md:flex-col justify-start gap-2">              <button
                onClick={() => handleUpdateOrderStatus(order.id_pedido, 4)} // Marcar como despachado
                disabled={updatingOrder === order.id_pedido}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaTruck className="flex-shrink-0" />
                <span>{updatingOrder === order.id_pedido ? 'Procesando...' : 'Despachar'}</span>
              </button>

              <button
                onClick={() => handleUpdateOrderStatus(order.id_pedido, 3)} // Marcar como entregado
                disabled={updatingOrder === order.id_pedido}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaCheckCircle className="flex-shrink-0" />
                <span>{updatingOrder === order.id_pedido ? 'Procesando...' : 'Entregar'}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
