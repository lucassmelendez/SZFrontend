'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaKey, FaArrowLeft, FaPhone, FaMapMarkerAlt, FaIdCard, FaUserTag, FaShoppingBag, FaClock, FaMoneyBillWave, FaTruck, FaCheckCircle, FaTimesCircle, FaBoxOpen } from 'react-icons/fa';
import Link from 'next/link';
import { authApi, isCliente, Pedido as ApiPedido, pedidoProductoApiFast, pedidoApiFast } from '@/lib/api';
import { useLoginModal } from '@/lib/auth/LoginModalContext';

// Interfaz para los pedidos
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

interface PedidoProducto {
  nombre: string;
  cantidad: number;
  precio: number;
}

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { openLoginModal } = useLoginModal();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.correo || '',
    telefono: user?.telefono?.toString() || '',
    direccion: user?.direccion || '',
    rut: user?.rut || '',
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

  // Proteger la ruta si no hay usuario autenticado
  useEffect(() => {
    if (!user) {
      router.push('/');
      openLoginModal();
    } else {
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
      
      // Cargar pedidos del usuario cuando el usuario esté autenticado
      if (activeTab.startsWith('pedidos')) {
        cargarPedidos();
      }
    }
  }, [user, router, openLoginModal, activeTab]);

  // Función para cargar los pedidos del usuario
  const cargarPedidos = async () => {
    if (!user || !isCliente(user)) return;
    
    setLoadingPedidos(true);
    try {
      const pedidosCliente = await authApi.getPedidosCliente(user.id_cliente);
      
      // Obtener los productos para cada pedido
      const pedidosConProductos = await Promise.all(
        pedidosCliente.map(async (pedido) => {
          try {
            const productos = await pedidoProductoApiFast.getByPedido(pedido.id_pedido!);
            return {
              ...pedido,
              estado: pedido.id_estado_envio <= 2 ? 'En proceso' : 'Entregado',
              productos: productos.map(prod => ({
                nombre: prod.nombre || 'Producto',
                cantidad: prod.cantidad,
                precio: prod.precio_unitario
              })),
              total: productos.reduce((sum, prod) => sum + (prod.precio_unitario * prod.cantidad), 0)
            };
          } catch (error) {
            console.error(`Error al obtener productos del pedido ${pedido.id_pedido}:`, error);
            return {
              ...pedido,
              estado: pedido.id_estado_envio <= 2 ? 'En proceso' : 'Entregado',
              productos: [],
              total: 0
            };
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
    try {
      await pedidoApiFast.updateEstadoEnvio(pedidoId, 3);
      // Recargar los pedidos después de actualizar
      cargarPedidos();
    } catch (error) {
      console.error('Error al confirmar recepción:', error);
      setError('Error al confirmar la recepción del pedido');
    }
  };

  const renderUserInfo = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:space-x-4">
        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-gray-700 p-5 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b pb-2">
              Información Personal
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <FaUser className="mt-1 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nombre Completo</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.nombre} {user.apellido}</p>
                </div>
      </div>

              <div className="flex items-start">
                <FaIdCard className="mt-1 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">RUT</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.rut || 'No disponible'}</p>
                </div>
        </div>

              {user.id_rol !== undefined && (
                <div className="flex items-start">
                  <FaUserTag className="mt-1 text-gray-500 dark:text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Usuario</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.id_rol === 1 ? 'Cliente' : 'Administrador'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-4 mt-4 md:mt-0">
          <div className="bg-white dark:bg-gray-700 p-5 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b pb-2">
              Información de Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <FaEnvelope className="mt-1 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Correo Electrónico</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.correo}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaPhone className="mt-1 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.telefono || 'No disponible'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaMapMarkerAlt className="mt-1 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dirección</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.direccion || 'No disponible'}</p>
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
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
          </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 border-t pt-6 dark:border-gray-600">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Cambiar Contraseña (opcional)
        </h3>
        
        <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    const pedidosFiltrados = pedidos.filter(pedido => pedido.estado === estado);
    const estadoLabel = estado === 'En proceso' ? 'en proceso' : 'entregados';
    
    // Colores según estado
    const statusColor = estado === 'En proceso' ? 'yellow' : 'green';
                      
    // Iconos según estado
    const StatusIcon = estado === 'En proceso' ? FaTruck : FaCheckCircle;
    
    return (
      <div className="space-y-6">
        {loadingPedidos ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-700 rounded-lg shadow-md">
            <FaShoppingBag className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tienes pedidos</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">¡Comienza a comprar ahora!</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ver productos
            </button>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-700 rounded-lg shadow-md">
            <StatusIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No tienes pedidos {estadoLabel}
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {estado === 'En proceso' ? 'Tus pedidos en proceso aparecerán aquí' : 
               'Tus pedidos entregados aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidosFiltrados.map((pedido) => (
              <div 
                key={pedido.id_pedido} 
                className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600"
              >
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center mb-2 md:mb-0">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        Pedido #{pedido.id_pedido}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FaClock className="mr-1.5" />
                      {pedido.fecha}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden mb-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Producto
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Precio
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {pedido.productos && pedido.productos.map((producto, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {producto.nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {producto.cantidad}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                              ${producto.precio.toLocaleString('es-CL')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <FaMoneyBillWave className="mr-2 text-green-600 dark:text-green-400" />
                      <span className="font-medium">Total del pedido</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {pedido.id_estado_envio === 1 && (
                        <button
                          onClick={() => handleConfirmarRecepcion(pedido.id_pedido!)}
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <FaBoxOpen className="mr-2" />
                          Confirmar Recepción
                        </button>
                      )}
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${pedido.total.toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div>
              <p className="text-white font-medium text-lg">
                {user.nombre} {user.apellido}
              </p>
              <p className="text-blue-100 text-sm mt-1">
                {user.correo}
              </p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'info'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <FaUser className={`mr-3 h-5 w-5 ${
                activeTab === 'info' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`} />
              Información Personal
            </button>
            
            <div className="py-2">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mis Pedidos
              </h3>
            </div>

            <button
              onClick={() => {
                setActiveTab('pedidos-proceso');
                cargarPedidos();
              }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'pedidos-proceso'
                  ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <FaTruck className={`mr-3 h-5 w-5 ${
                activeTab === 'pedidos-proceso' ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'
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
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <FaCheckCircle className={`mr-3 h-5 w-5 ${
                activeTab === 'pedidos-entregados' ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
              }`} />
              Entregados
            </button>
          </nav>
        </div>

        <div className="flex-1">
          {error && (
            <div className="m-6 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="m-6 bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="p-6">
            {activeTab === 'info' && (isEditing ? renderEditForm() : renderUserInfo())}
            {activeTab === 'pedidos-proceso' && renderPedidosPorEstado('En proceso')}
            {activeTab === 'pedidos-entregados' && renderPedidosPorEstado('Entregado')}
          </div>
        </div>
      </div>
    </div>
  );
}