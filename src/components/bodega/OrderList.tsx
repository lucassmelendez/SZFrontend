'use client';

import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { pedidoApiFast, pedidoProductoApiFast, Pedido, PedidoProducto, productoApi, clienteApiFast } from '@/lib/api';

// Extender la interfaz Pedido con campos adicionales necesarios
interface OrderWithDetails extends Pedido {
  total: number;
  productos: Array<PedidoProducto & { nombre: string }>;
  cliente: {
    correo: string;
    nombre: string;
    apellido: string;
    telefono: string;
    direccion: string;
  };
  estado_envio: string;
  medio_pago: string;
}

export default function OrderList() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
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
      const pedidos = await pedidoApiFast.getAll();
      // Filtrar solo los pedidos pagados (id_estado === 1)
      const pedidosPagados = pedidos.filter(pedido => pedido.id_estado === 1);
      
      const pedidosConProductos = await Promise.all(
        pedidosPagados.map(async (pedido: Pedido) => {
          if (!pedido.id_pedido) return null;
          
          const pedidoProductos = await pedidoProductoApiFast.getByPedido(pedido.id_pedido);
          const productosConDetalles = await Promise.all(
            pedidoProductos.map(async (pp) => {
              const producto = await productoApi.getById(pp.id_producto);
              return { ...pp, nombre: producto.nombre };
            })
          );
          
          const total = productosConDetalles.reduce(
            (acc, curr) => acc + (curr.precio_unitario * curr.cantidad), 
            0
          );

          try {
            const clienteData = await clienteApiFast.getById(pedido.id_cliente);

            // Mapeo de estados
            const estadosEnvio = {
              1: "Enviado",
              2: "Pendiente",
              3: "Recibido"
            };

            const mediosPago = {
              1: "Transferencia",
              2: "Webpay"
            };

            return { 
              ...pedido, 
              productos: productosConDetalles,
              total,
              cliente: clienteData ? {
                correo: clienteData.correo,
                nombre: clienteData.nombre,
                apellido: clienteData.apellido,
                telefono: clienteData.telefono,
                direccion: clienteData.direccion
              } : undefined,
              estado_envio: estadosEnvio[pedido.id_estado_envio as keyof typeof estadosEnvio] || "Desconocido",
              medio_pago: mediosPago[pedido.medio_pago_id as keyof typeof mediosPago] || "Desconocido"
            } as OrderWithDetails;
          } catch (error) {
            console.error('Error al obtener información del cliente:', error);
            return null;
          }
        })
      );

      setOrders(pedidosConProductos.filter((p: OrderWithDetails | null): p is OrderWithDetails => p !== null));
      setError(null);
    } catch (err) {
      console.error('Error al cargar las órdenes:', err);
      setError('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = async (orderId: number) => {
    try {
      setUpdatingOrder(orderId);      // Actualizar la orden a id_estado_envio = 2 (Listo para envío)
      await pedidoApiFast.updateEstadoEnvio(orderId, 2);
      toast.success('Orden marcada como lista para envío');
      // Recargar órdenes
      await fetchOrders();
    } catch (err) {
      console.error('Error al actualizar la orden:', err);
      toast.error('Error al marcar la orden como lista');
    } finally {
      setUpdatingOrder(null);
    }
  };  

  const handleMarkAsDispatched = async (orderId: number) => {
    try {
      setUpdatingOrder(orderId);
      
      // Actualizar a estado_envio = 1 (Enviado)
      await pedidoApiFast.updateEstadoEnvio(orderId, 1);
      
      toast.success('¡Orden despachada con éxito!');
      await fetchOrders();
    } catch (err) {
      console.error('Error al actualizar la orden:', err);
      toast.error('Error al despachar la orden');
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No hay órdenes aceptadas para procesar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Productos</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado Envío</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Medio Pago</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {orders.filter((order): order is OrderWithDetails => order.id_pedido != null).map((order) => (
            <tr key={order.id_pedido} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                #{order.id_pedido}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {new Date(order.fecha).toLocaleString()}
              </td>              
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {order.cliente ? order.cliente.correo : 'N/A'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                <ul className="list-disc list-inside">
                  {order.productos.map((producto: PedidoProducto & { nombre: string }) => (
                    <li key={producto.id_producto}>
                      {producto.nombre} x{producto.cantidad}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                ${order.total.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  order.id_estado === 1 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {order.id_estado === 1 ? 'Pagado' : 'No pagado'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {order.estado_envio}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {order.medio_pago}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                {order.id_estado === 1 && order.id_estado_envio === 2 ? (
                  <button
                    onClick={() => handleMarkAsDispatched(order.id_pedido!)}
                    disabled={updatingOrder === order.id_pedido}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs transition-colors disabled:opacity-50"
                  >
                    {updatingOrder === order.id_pedido ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full"></span>
                        Procesando...
                      </span>
                    ) : (
                      'Despachar'
                    )}
                  </button>
                ) : order.id_estado_envio === 1 ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Enviado
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    No disponible
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
