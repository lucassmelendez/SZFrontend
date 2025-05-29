'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado, pedidoApiFast, pedidoProductoApiFast, productoApi, clienteApiFast } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaSearch } from 'react-icons/fa';
import CambiarContrasenaModal from '@/components/auth/CambiarContrasenaModal';

interface OrderWithDetails {
  id_pedido: number;
  fecha: string;
  total: number;
  total_original: number;
  total_descuentos: number;
  aplicar_descuento: boolean;
  estado_envio: string;
  id_estado: number;
  id_estado_envio: number;
  medio_pago: string;
  medio_pago_id: number;
  productos: Array<{
    id_producto: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  cliente?: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    direccion: string;
  };
}

const estadosEnvio: Record<number, string> = {
  1: "Preparado",
  2: "Pendiente",
  3: "Entregado",
  4: "Despachado"
};

const mediosPago: Record<number, string> = {
  1: "Transferencia",
  2: "Webpay"
};

export default function ContabilidadDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pagado' | 'no_pagado'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarModalCambioContrasena, setMostrarModalCambioContrasena] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      if (!user || !isEmpleado(user) || user.rol_id !== 5) {
        router.push('/');
      } else {
        // Verificar si es primer inicio de sesión
        if (isEmpleado(user) && user.primer_login === true) {
          console.log("Mostrando modal de cambio de contraseña para primer inicio de sesión (Contabilidad)");
          setMostrarModalCambioContrasena(true);
          // Mostrar alerta adicional
          setTimeout(() => {
            alert("Por seguridad, debes cambiar tu contraseña antes de continuar.");
          }, 500);
        }
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchOrders();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const pedidos = await pedidoApiFast.getAll();
      
      const pedidosConProductos = await Promise.all(
        pedidos.filter(p => p.id_pedido != null).map(async (pedido) => {
          const pedidoProductos = await pedidoProductoApiFast.getByPedido(pedido.id_pedido!);
          const productosConDetalles = await Promise.all(
            pedidoProductos.map(async (pp) => {
              const producto = await productoApi.getById(pp.id_producto);
              return {
                id_producto: pp.id_producto,
                nombre: producto.nombre,
                cantidad: pp.cantidad,
                precio_unitario: pp.precio_unitario
              };
            })
          );
            const total_original = productosConDetalles.reduce(
            (acc, curr) => acc + (curr.precio_unitario * curr.cantidad),
            0
          );
          
          // Verificar si aplica descuento (más de 4 productos)
          const cantidad_total = productosConDetalles.reduce(
            (acc, curr) => acc + curr.cantidad,
            0
          );
          const aplicar_descuento = cantidad_total > 4;
          const total_descuentos = aplicar_descuento ? Math.round(total_original * 0.05) : 0;
          const total = total_original - total_descuentos;

          try {            const clienteData = pedido.cliente || await clienteApiFast.getById(pedido.id_cliente);

            const orderWithDetails: OrderWithDetails = {
              id_pedido: pedido.id_pedido!,
              fecha: pedido.fecha,
              total,
              total_original,
              total_descuentos,
              aplicar_descuento,
              estado_envio: estadosEnvio[pedido.id_estado_envio] || "Desconocido",
              id_estado: pedido.id_estado,
              id_estado_envio: pedido.id_estado_envio,
              medio_pago: mediosPago[pedido.medio_pago_id] || "Desconocido",
              medio_pago_id: pedido.medio_pago_id,
              productos: productosConDetalles,
              cliente: clienteData ? {
                correo: clienteData.correo,
                nombre: clienteData.nombre,
                apellido: clienteData.apellido,
                telefono: String(clienteData.telefono),
                direccion: clienteData.direccion
              } : undefined
            };

            return orderWithDetails;
          } catch (error) {
            console.error('Error al obtener información del cliente:', error);
            return null;
          }
        })
      );

      const validPedidos = pedidosConProductos.filter((p): p is OrderWithDetails => p !== null);
      // Ordenar pedidos de más reciente a más antiguo basado en id_pedido
      const ordenados = validPedidos.sort((a, b) => b.id_pedido - a.id_pedido);
      setOrders(ordenados);
      setError(null);
    } catch (err) {
      console.error('Error al cargar los pedidos:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };
  const handleApprovePayment = async (orderId: number) => {
    try {
      setUpdatingOrder(orderId);
      // Actualizar el estado del pedido a pagado (id_estado = 1)
      const result = await pedidoApiFast.update(orderId, { id_estado: 1 });
      console.log('Respuesta de actualización de estado:', result);
      toast.success('Pago aprobado correctamente');
      await fetchOrders();
    } catch (err) {
      console.error('Error al aprobar el pago:', err);
      toast.error('Error al aprobar el pago');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    // Filtrar por estado de pago
    if (filterStatus === 'pagado' && order.id_estado !== 1) return false;
    if (filterStatus === 'no_pagado' && order.id_estado === 1) return false;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.cliente?.nombre?.toLowerCase().includes(searchLower) ||
        order.cliente?.apellido?.toLowerCase().includes(searchLower) ||
        order.id_pedido.toString().includes(searchLower)
      );
    }

    return true;
  }).sort((a, b) => b.id_pedido - a.id_pedido);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {mostrarModalCambioContrasena && <CambiarContrasenaModal onComplete={() => setMostrarModalCambioContrasena(false)} />}
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Panel de Contabilidad</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'todos'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('pagado')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'pagado'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Pagados
            </button>
            <button
              onClick={() => setFilterStatus('no_pagado')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'no_pagado'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              No Pagados
            </button>
          </div>
          <div className="relative flex items-center w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente o N° pedido..."
              className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="grid gap-4 p-6">
          <p className="text-sm text-gray-500 italic mb-2">
            Los pedidos se muestran ordenados del más reciente al más antiguo según su número de pedido.
          </p>
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay pedidos que coincidan con los filtros seleccionados.
            </p>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id_pedido}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  {/* Información del pedido */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Pedido #{order.id_pedido}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        order.id_estado === 1
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.id_estado === 1 ? 'Pagado' : 'No Pagado'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Fecha: {new Date(order.fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Medio de pago: {order.medio_pago}
                    </p>
                    <p className="text-sm text-gray-600">
                      Estado envío: {order.estado_envio}
                    </p>
                  </div>

                  {/* Información del cliente */}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Información del cliente
                    </h4>
                    {order.cliente ? (
                      <>
                        <p className="text-sm text-gray-600">
                          {order.cliente.nombre} {order.cliente.apellido}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.cliente.correo}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.cliente.telefono}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">N/A</p>
                    )}
                  </div>

                  {/* Productos y acciones */}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Productos
                    </h4>
                    <ul className="space-y-1">
                      {order.productos.map((producto) => (
                        <li
                          key={producto.id_producto}
                          className="text-sm text-gray-600"
                        >
                          {producto.nombre} x{producto.cantidad}
                        </li>
                      ))}
                    </ul>                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Subtotal: ${order.total_original.toLocaleString()}
                      </p>
                      {order.aplicar_descuento && (
                        <p className="text-sm text-green-600">
                          Descuento (5%): -${order.total_descuentos.toLocaleString()}
                        </p>
                      )}
                      <p className="text-base font-medium text-gray-800">
                        Total final: ${order.total.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center gap-2">
                    {order.medio_pago_id === 1 && order.id_estado !== 1 && (
                      <button
                        onClick={() => handleApprovePayment(order.id_pedido)}
                        disabled={updatingOrder === order.id_pedido}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          updatingOrder === order.id_pedido
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <FaCheckCircle />
                        {updatingOrder === order.id_pedido ? 'Procesando...' : 'Aprobar Pago'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}