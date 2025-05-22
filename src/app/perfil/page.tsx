'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaKey, FaArrowLeft, FaPhone, FaMapMarkerAlt, FaIdCard, FaUserTag, FaShoppingBag, FaClock, FaMoneyBillWave, FaTruck, FaCheckCircle, FaTimesCircle, FaBoxOpen, FaExclamationCircle } from 'react-icons/fa';
import Link from 'next/link';
import { authApi, isCliente, Pedido as ApiPedido, pedidoProductoApiFast, pedidoApiFast, productoApi } from '@/lib/api';
import { useLoginModal } from '@/lib/auth/LoginModalContext';
import toast from 'react-hot-toast';

// Interfaz para los pedidos
interface ApiPedidoExtended extends ApiPedido {
  id_pedido?: number;
  estado?: string;
  total?: number;
  productos?: PedidoProducto[];
}

interface PedidoProducto {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface Pedido {
  id_pedido: number;
  fecha: string;
  estado: string;
  total: number;
  productos?: PedidoProducto[];
  id_estado: number;
  id_estado_envio: number;
  medio_pago_id: number;
  id_cliente: number;
}

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { openLoginModal } = useLoginModal();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    rut: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Proteger la ruta si no hay usuario autenticado
  useEffect(() => {
    if (!user) {
      router.push('/');
      openLoginModal();
    } else {
      // Actualizar el formulario con los datos del usuario
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.correo || '',
        telefono: user.telefono?.toString() || '',
        direccion: user.direccion || '',
        rut: user.rut || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Establecer tab activo según el tipo de usuario
      if (isCliente(user)) {
        // Si es cliente, mostrar "Todos los pedidos" por defecto
        setActiveTab('pedidos-todos');
        // Cargar pedidos del usuario cuando el usuario es cliente
        cargarPedidos();
      } else {
        // Si es empleado, mostrar "Información personal" por defecto
        setActiveTab('info');
      }
    }
    setIsUserLoading(false);
  }, [user, router, openLoginModal]);

  // Función para cargar los pedidos del usuario
  const cargarPedidos = async () => {
    if (!user || !isCliente(user)) return;
    
    setLoadingPedidos(true);
    try {
      const pedidosCliente = await authApi.getPedidosCliente(user.id_cliente);
      
      // Obtener los productos para cada pedido
      const pedidosConProductos = await Promise.all(
        pedidosCliente.map(async (pedido: ApiPedidoExtended) => {
          try {
            // Asegurarnos de que id_pedido existe, y si no, usamos un valor por defecto
            const pedidoId = pedido.id_pedido !== undefined ? pedido.id_pedido : 0;
            
            const productos = await pedidoProductoApiFast.getByPedido(pedidoId);
            
            // Obtener los detalles de cada producto
            const productosConDetalles = await Promise.all(
              productos.map(async (prod) => {
                try {
                  const producto = await productoApi.getById(prod.id_producto);
                  return {
                    ...prod,
                    nombre: producto.nombre
                  };
                } catch (error) {
                  console.error(`Error al obtener detalles del producto ${prod.id_producto}:`, error);
                  return {
                    ...prod,
                    nombre: 'Producto no disponible'
                  };
                }
              })
            );

            // Corregir la lógica del estado: estados 1, 2 y 4 son "En proceso", estado 3 es "Entregado"
            const estadoPedido = pedido.id_estado_envio === 3 ? 'Entregado' : 'En proceso';

            // Crear un objeto Pedido con todos los campos requeridos
            const pedidoCompleto: Pedido = {
              id_pedido: pedidoId,
              fecha: pedido.fecha,
              estado: estadoPedido,
              total: productosConDetalles.reduce((sum, prod) => sum + (prod.precio_unitario * prod.cantidad), 0),
              productos: productosConDetalles.map(prod => ({
                nombre: prod.nombre,
                cantidad: prod.cantidad,
                precio: prod.precio_unitario
              })),
              id_estado: pedido.id_estado,
              id_estado_envio: pedido.id_estado_envio,
              medio_pago_id: pedido.medio_pago_id,
              id_cliente: pedido.id_cliente
            };
            
            return pedidoCompleto;
          } catch (error) {
            console.error(`Error al obtener productos del pedido ${pedido.id_pedido}:`, error);
            
            // En caso de error, también crear un objeto Pedido válido con la lógica corregida
            const pedidoId = pedido.id_pedido !== undefined ? pedido.id_pedido : 0;
            const estadoPedido = pedido.id_estado_envio === 3 ? 'Entregado' : 'En proceso';
            
            const pedidoCompleto: Pedido = {
              id_pedido: pedidoId,
              fecha: pedido.fecha,
              estado: estadoPedido,
              total: 0,
              productos: [],
              id_estado: pedido.id_estado,
              id_estado_envio: pedido.id_estado_envio,
              medio_pago_id: pedido.medio_pago_id,
              id_cliente: pedido.id_cliente
            };
            
            return pedidoCompleto;
          }
        })
      );
      
      setPedidos(pedidosConProductos);
      setLoadingPedidos(false);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      setLoadingPedidos(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validar contraseñas si se está intentando cambiar
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          setError('Debes proporcionar tu contraseña actual para cambiarla');
          setIsLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Las contraseñas nuevas no coinciden');
          setIsLoading(false);
          return;
        }
      }

      const updateData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion,
        ...(formData.newPassword ? {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        } : {})
      };

      const response = await authApi.updateProfile(updateData);
      setSuccess('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmarRecepcion = async (pedidoId: number) => {
    toast((t) => (
      <div className="flex flex-col items-center">
        <p className="mb-4">¿Estás seguro que deseas confirmar la recepción de este pedido?</p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            onClick={() => {
              toast.dismiss(t.id);
              toast.promise(
                (async () => {
                  await pedidoApiFast.updateEstadoEnvio(pedidoId, 3);
                  await cargarPedidos();
                })(),
                {
                  loading: 'Confirmando recepción...',
                  success: '¡Pedido recepcionado correctamente!',
                  error: 'Error al confirmar la recepción del pedido'
                }
              );
            }}
          >
            Confirmar
          </button>
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
    });
  };

  const renderUserInfo = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:space-x-4">
        <div className="flex-1 space-y-4">
          <div className="bg-white p-5 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
              Información Personal
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <FaUser className="mt-1 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Nombre Completo</p>
                  <p className="font-medium text-gray-900">{user?.nombre || ''} {user?.apellido || ''}</p>
                </div>
      </div>

              <div className="flex items-start">
                <FaIdCard className="mt-1 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">RUT</p>
                  <p className="font-medium text-gray-900">{user?.rut || 'No disponible'}</p>
                </div>
        </div>

              {user && 'id_rol' in user && (
                <div className="flex items-start">
                  <FaUserTag className="mt-1 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Usuario</p>
                    <p className="font-medium text-gray-900">
                      {isCliente(user) ? 'Cliente' : 'Administrador'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-4 mt-4 md:mt-0">
          <div className="bg-white p-5 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
              Información de Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <FaEnvelope className="mt-1 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Correo Electrónico</p>
                  <p className="font-medium text-gray-900">{user?.correo || ''}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaPhone className="mt-1 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{user?.telefono || 'No disponible'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaMapMarkerAlt className="mt-1 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium text-gray-900">{user?.direccion || 'No disponible'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Editar Perfil
        </button>
      </div>
    </div>
  );
  
  const renderEditForm = () => (
        <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                id="nombre"
                name="nombre"
                type="text"
              value={formData.nombre}
                onChange={handleChange}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
            Apellido
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="text-gray-400" />
            </div>
            <input
              id="apellido"
              name="apellido"
              type="text"
              value={formData.apellido}
              onChange={handleChange}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
              value={formData.email}
                onChange={handleChange}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaPhone className="text-gray-400" />
            </div>
            <input
              id="telefono"
              name="telefono"
              type="text"
              value={formData.telefono}
              onChange={handleChange}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMapMarkerAlt className="text-gray-400" />
            </div>
            <input
              id="direccion"
              name="direccion"
              type="text"
              value={formData.direccion}
              onChange={handleChange}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Cambiar Contraseña (opcional)
        </h3>
        
        <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Contraseña actual
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaKey className="text-gray-400" />
                  </div>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              Nueva contraseña
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaKey className="text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar nueva contraseña
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaKey className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
            </div>
          </div>
                </div>
              </div>

      <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
    </form>
  );

  // Función para renderizar pedidos según el estado seleccionado
  const renderPedidosPorEstado = (estado: string) => {
    // Si es "todos", no filtramos
    const pedidosFiltrados = estado === 'todos' ? pedidos : pedidos.filter(pedido => pedido.estado === estado);
    
    // Establecer etiquetas según el estado
    let estadoLabel = '';
    if (estado === 'En proceso') estadoLabel = 'en proceso';
    else if (estado === 'Entregado') estadoLabel = 'entregados';
    else estadoLabel = '';
    
    // Colores según estado
    let statusColor = 'blue';
    if (estado === 'En proceso') statusColor = 'yellow';
    else if (estado === 'Entregado') statusColor = 'green';
    
    // Iconos según estado
    let StatusIcon = FaShoppingBag;
    if (estado === 'En proceso') StatusIcon = FaTruck;
    else if (estado === 'Entregado') StatusIcon = FaCheckCircle;
    
    // Función para obtener estado detallado según id_estado_envio
    const getEstadoDetallado = (id_estado_envio: number) => {
      switch (id_estado_envio) {
        case 1:
          return { texto: 'Preparado', color: 'blue', icon: FaBoxOpen };
        case 2:
          return { texto: 'Pendiente', color: 'yellow', icon: FaClock };
        case 3:
          return { texto: 'Entregado', color: 'green', icon: FaCheckCircle };
        case 4:
          return { texto: 'Despachado', color: 'purple', icon: FaTruck };
        default:
          return { texto: 'Desconocido', color: 'gray', icon: FaExclamationCircle };
      }
    };
    
    return (
      <div className="space-y-6">
        {loadingPedidos ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <FaShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No tienes pedidos</h3>
            <p className="mt-1 text-gray-500">¡Comienza a comprar ahora!</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ver productos
            </button>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <StatusIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No tienes pedidos {estadoLabel}
            </h3>
            <p className="mt-1 text-gray-500">
              {estado === 'En proceso' ? 'Tus pedidos en proceso aparecerán aquí' : 
               estado === 'Entregado' ? 'Tus pedidos entregados aparecerán aquí' :
               'Tus pedidos aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidosFiltrados.map((pedido) => {
              const estadoDetallado = getEstadoDetallado(pedido.id_estado_envio);
              const EstadoIcon = estadoDetallado.icon;
              
              return (
                <div 
                  key={pedido.id_pedido} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                >
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center mb-2 md:mb-0">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Pedido #{pedido.id_pedido}
                        </span>
                        
                        {/* Mostrar el estado detallado del pedido en todas las vistas */}
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 
                          ${estadoDetallado.color === 'blue' ? 'bg-blue-100 text-blue-800' : 
                            estadoDetallado.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 
                            estadoDetallado.color === 'green' ? 'bg-green-100 text-green-800' : 
                            estadoDetallado.color === 'purple' ? 'bg-purple-100 text-purple-800' : 
                            'bg-gray-100 text-gray-800'}`}
                        >
                          <EstadoIcon className="h-3 w-3" />
                          <span>{estadoDetallado.texto}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <FaClock className="mr-1.5" />
                        {pedido.fecha}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Producto
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pedido.productos && pedido.productos.map((producto, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {producto.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {producto.cantidad}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ${producto.precio.toLocaleString('es-CL')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex items-center text-gray-700">
                        <FaMoneyBillWave className="mr-2 text-green-600" />
                        <span className="font-medium">Total del pedido</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {pedido.id_estado_envio === 4 && (
                          <button
                            onClick={() => handleConfirmarRecepcion(pedido.id_pedido)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            <FaBoxOpen className="mr-2" />
                            Confirmar Recepción
                          </button>
                        )}
                        <p className="text-xl font-bold text-gray-900">
                          ${pedido.total.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-64 bg-gray-50">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div>
              <p className="text-white font-medium text-lg">
                {user?.nombre || ''} {user?.apellido || ''}
              </p>
              <p className="text-blue-100 text-sm mt-1">
                {user?.correo || ''}
              </p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'info'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FaUser className={`mr-3 h-5 w-5 ${
                activeTab === 'info' ? 'text-blue-500' : 'text-gray-400'
              }`} />
              Información Personal
            </button>
            
            {/* Mostrar sección "Mis Pedidos" solo si es cliente */}
            {user && isCliente(user) && (
              <>
                <div className="py-2">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mis Pedidos
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('pedidos-todos');
                    cargarPedidos();
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'pedidos-todos'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaShoppingBag className={`mr-3 h-5 w-5 ${
                    activeTab === 'pedidos-todos' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  Todos
                </button>

                <button
                  onClick={() => {
                    setActiveTab('pedidos-proceso');
                    cargarPedidos();
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'pedidos-proceso'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaTruck className={`mr-3 h-5 w-5 ${
                    activeTab === 'pedidos-proceso' ? 'text-yellow-500' : 'text-gray-400'
                  }`} />
                  En Proceso
                </button>

                <button
                  onClick={() => {
                    setActiveTab('pedidos-entregados');
                    cargarPedidos();
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'pedidos-entregados'
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaCheckCircle className={`mr-3 h-5 w-5 ${
                    activeTab === 'pedidos-entregados' ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  Entregados
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="flex-1">
          {error && (
            <div className="m-6 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="m-6 bg-green-50 text-green-600 p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="p-6">
            {activeTab === 'info' && (isEditing ? renderEditForm() : renderUserInfo())}
            {user && isCliente(user) && activeTab === 'pedidos-todos' && renderPedidosPorEstado('todos')}
            {user && isCliente(user) && activeTab === 'pedidos-proceso' && renderPedidosPorEstado('En proceso')}
            {user && isCliente(user) && activeTab === 'pedidos-entregados' && renderPedidosPorEstado('Entregado')}
          </div>
        </div>
      </div>
    </div>
  );
}