'use client';

import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { pedidoApiFast, pedidoProductoApiFast, Pedido, PedidoProducto, productoApi, clienteApiFast } from '@/lib/api';

// Extender la interfaz Pedido con campos adicionales necesarios
interface OrderWithDetails extends Pedido {
  total: number;
  total_original: number;
  total_descuentos: number;
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
  aplicar_descuento?: boolean;
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
      console.log('Pedidos obtenidos:', pedidos);
      // Filtrar solo los pedidos pagados (id_estado === 1)
      const pedidosPagados = pedidos.filter(pedido => pedido.id_estado === 1);
      console.log('Pedidos pagados:', pedidosPagados);
      
      const pedidosConProductos = await Promise.all(
        pedidosPagados.map(async (pedido: Pedido) => {
          if (!pedido.id_pedido) return null;
          console.log('Procesando pedido:', pedido);
          
          const pedidoProductos = await pedidoProductoApiFast.getByPedido(pedido.id_pedido);
          const productosConDetalles = await Promise.all(
            pedidoProductos.map(async (pp) => {
              const producto = await productoApi.getById(pp.id_producto);
              return { ...pp, nombre: producto.nombre };
            })
          );
          
          // Calculate original total and check if discount applies
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

          try {
            console.log('Obteniendo datos del cliente para pedido:', pedido.id_pedido, 'ID Cliente:', pedido.id_cliente);
            // Si el cliente ya viene en la respuesta, usarlo directamente
            const clienteData = pedido.cliente || await clienteApiFast.getById(pedido.id_cliente);
            console.log('Datos del cliente obtenidos:', clienteData);

            // Mapeo de estados
            const estadosEnvio = {
              1: "Preparado",
              2: "Pendiente",
              3: "Entregado",
              4: "Despachado"
            };

            const mediosPago = {
              1: "Transferencia",
              2: "Webpay"
            };

            return { 
              ...pedido, 
              productos: productosConDetalles,
              total_original,
              total_descuentos,
              total,
              aplicar_descuento,
              cliente: clienteData ? {
                correo: clienteData.correo,
                nombre: clienteData.nombre,
                apellido: clienteData.apellido,
                telefono: clienteData.telefono,
                direccion: clienteData.direccion
              } : undefined,
              estado_envio: estadosEnvio[pedido.id_estado_envio as keyof typeof estadosEnvio] || "Desconocido",
              medio_pago: mediosPago[pedido.medio_pago_id as keyof typeof mediosPago] || "Desconocido",
            } as OrderWithDetails;
          } catch (error) {
            console.error('Error al obtener información del cliente:', error);
            return null;
          }
        })
      );

      // Filtrar órdenes nulas y ordenar por ID descendente (más recientes primero)
      const ordersList = pedidosConProductos
        .filter((p: OrderWithDetails | null): p is OrderWithDetails => p !== null)
        .sort((a, b) => (b.id_pedido || 0) - (a.id_pedido || 0));

      setOrders(ordersList);
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
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="text-center py-8 text-gray-600">
        No hay órdenes aceptadas para procesar
      </div>
    );
  }

  return (
    <>
      {/* Versión móvil */}
      <div className="md:hidden space-y-4">
        {orders.filter((order): order is OrderWithDetails => order.id_pedido != null).map((order) => (
          <div key={order.id_pedido} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Encabezado del pedido */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">
                  Pedido #{order.id_pedido}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(order.fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                </span>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Cliente</h3>
              {order.cliente ? (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{`${order.cliente.nombre} ${order.cliente.apellido}`}</p>
                  <p>{order.cliente.correo}</p>
                  <p>{order.cliente.telefono}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">N/A</p>
              )}
            </div>

            {/* Productos */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Productos</h3>
              <ul className="space-y-1">
                {order.productos.map((producto: PedidoProducto & { nombre: string }) => (
                  <li key={producto.id_producto} className="text-sm text-gray-600">
                    {producto.nombre} x{producto.cantidad}
                  </li>
                ))}
              </ul>              <div className="mt-2 space-y-1">
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

            {/* Estados y acciones */}
            <div className="px-4 py-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  order.id_estado === 1 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {order.id_estado === 1 ? 'Pagado' : 'No pagado'}
                </span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  order.id_estado_envio === 1 
                    ? 'bg-blue-100 text-blue-800'
                    : order.id_estado_envio === 2
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.id_estado_envio === 3
                    ? 'bg-green-100 text-green-800'
                    : order.id_estado_envio === 4
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.estado_envio}
                </span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  order.medio_pago === 'Transferencia' || order.medio_pago === 'Webpay'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.medio_pago}
                </span>
              </div>

              {/* Botón de acción */}
              <div className="mt-3">
                {order.id_estado === 1 && order.id_estado_envio === 2 ? (
                  <button
                    onClick={() => handleMarkAsDispatched(order.id_pedido!)}
                    disabled={updatingOrder === order.id_pedido}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors disabled:opacity-50"
                  >
                    {updatingOrder === order.id_pedido ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                        Procesando...
                      </span>
                    ) : (
                      'Despachar'
                    )}
                  </button>
                ) : order.id_estado_envio === 1 ? (
                  <span className="block text-center text-green-600 font-medium">
                    Enviado
                  </span>
                ) : (
                  <span className="block text-center text-gray-600 font-medium">
                    No disponible
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Versión web */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col">
                  <span>Total</span>
                  <span className="text-[10px] font-normal normal-case text-gray-400">(Subtotal / Descuento / Final)</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Pago</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Envío</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medio Pago</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.filter((order): order is OrderWithDetails => order.id_pedido != null).map((order) => (
              <tr key={order.id_pedido} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                  #{order.id_pedido}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(order.fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                </td>              
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {order.cliente ? (
                    <div>
                      <div className="font-medium">{`${order.cliente.nombre} ${order.cliente.apellido}`}</div>
                      <div className="text-xs text-gray-500">{order.cliente.correo}</div>
                      <div className="text-xs text-gray-500">{order.cliente.telefono}</div>
                    </div>
                  ) : 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <ul className="list-disc list-inside">
                    {order.productos.map((producto: PedidoProducto & { nombre: string }) => (
                      <li key={producto.id_producto}>
                        {producto.nombre} x{producto.cantidad}
                      </li>
                    ))}
                  </ul>                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="space-y-1">
                    <div className="text-gray-600">
                      ${order.total_original.toLocaleString()}
                    </div>
                    {order.aplicar_descuento && (
                      <div className="text-green-600 text-xs">
                        -${order.total_descuentos.toLocaleString()}
                      </div>
                    )}
                    <div className="font-medium text-gray-800">
                      ${order.total.toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.id_estado === 1 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.id_estado === 1 ? 'Pagado' : 'No pagado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.id_estado_envio === 1 
                      ? 'bg-blue-100 text-blue-800'
                      : order.id_estado_envio === 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.id_estado_envio === 3
                      ? 'bg-green-100 text-green-800'
                      : order.id_estado_envio === 4
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.estado_envio}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.medio_pago === 'Transferencia' || order.medio_pago === 'Webpay'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.medio_pago}
                  </span>
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
                    <span className="text-green-600 font-medium">
                      Enviado
                    </span>
                  ) : (
                    <span className="text-gray-600 font-medium">
                      No disponible
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
