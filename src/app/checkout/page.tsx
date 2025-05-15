'use client';

// Este archivo ahora se renderiza sin header ni footer gracias al layout.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCheck, FaShoppingCart, FaHome } from 'react-icons/fa';
import { useCarrito } from '@/lib/useCarrito';
import { useFloatingCartContext } from '@/lib/FloatingCartContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLoginModal } from '@/lib/auth/LoginModalContext';
import { pedidoApiFast, pedidoProductoApiFast, PedidoProducto, isCliente, clienteApiFast } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, limpiarCarrito, calcularTotal } = useCarrito();
  const { closeCart } = useFloatingCartContext();
  const { user, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [loading, setLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Asegurarnos de que la página tiene tiempo para cargar los datos del carrito
  useEffect(() => {
    // Pequeño delay para asegurar que useCarrito haya cargado los datos
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    
    closeCart();

    return () => clearTimeout(timer);
  }, [closeCart]);
  
  // Banner simple para checkout
  const CheckoutBanner = () => (
    <div 
      className="text-white py-4" 
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/banner.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container mx-auto px-4 grid grid-cols-3 items-center">
        <div>
          <Link 
            href="/productos" 
            className="inline-flex items-center text-white hover:text-blue-200 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Seguir comprando
          </Link>
        </div>
        
        <h1 className="text-xl font-bold text-center">SpinZone</h1>
        
        <div className="flex justify-end">
          <Link
            href="/"
            className="inline-flex items-center text-white hover:text-blue-200 transition-colors p-1"
            aria-label="Ir al inicio"
          >
            <FaHome size={24} />
          </Link>
        </div>
      </div>
    </div>
  );

  // Formulario de checkout
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    metodoPago: 'webpay'
  });

  // Cargar los datos del usuario cuando esté disponible
  useEffect(() => {
    if (user && !authLoading) {
      setFormData(prevData => ({
        ...prevData,
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.correo || '',
        telefono: user.telefono?.toString() || '',
        direccion: user.direccion || ''
      }));
    }
  }, [user, authLoading]);

  // Validación del formulario
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value   
    });
    
    // Limpiar error cuando el usuario edita el campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Verificar si el usuario está autenticado
    if (!user) {
      // En lugar de solo abrir el modal, mostrar mensaje específico
      alert('Debes iniciar sesión o registrarte para continuar con la compra');
      openLoginModal();
      return;
    }
    
    // Verificar que el usuario sea un cliente
    if (!isCliente(user)) {
      alert('Solo los clientes pueden realizar pedidos');
      return;
    }
    
    setLoading(true);
    
    try {
      // Actualizar datos del cliente si se han modificado
      const clienteActualizado = await actualizarDatosCliente(user.id_cliente);
      
      // Si el método de pago es transferencia, crear pedido en la base de datos
      if (formData.metodoPago === 'transferencia') {
        // Crear el pedido con los valores específicos solicitados
        const nuevoPedido = await pedidoApiFast.create({
          fecha: new Date().toISOString(),
          medio_pago_id: 1, // ID para transferencia
          id_estado_envio: 2, // Estado de envío 2
          id_estado: 2, // Estado de pedido 2
          id_cliente: user.id_cliente
        });
        
        if (nuevoPedido && nuevoPedido.id_pedido) {
          // Preparar los productos para agregar al pedido
          const productosParaPedido: PedidoProducto[] = items.map(item => ({
            id_pedido: nuevoPedido.id_pedido!,
            id_producto: item.producto.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.producto.precio,
            subtotal: item.producto.precio * item.cantidad
          }));
          
          // Agregar los productos al pedido usando el método bulk
          await pedidoProductoApiFast.addBulk(nuevoPedido.id_pedido, productosParaPedido);
          
          // Limpiar el carrito y mostrar mensaje de éxito
          limpiarCarrito();
          setCheckoutSuccess(true);
        } else {
          throw new Error('No se pudo crear el pedido');
        }
      } else {
        // Si es otro método de pago (webpay), mantener el comportamiento actual
        // Simular procesamiento del pago por 2 segundos
        setTimeout(() => {
          limpiarCarrito();
          setCheckoutSuccess(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      alert('Hubo un error al procesar tu pedido. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar los datos del cliente si se han modificado
  const actualizarDatosCliente = async (idCliente: number) => {
    if (!user || !isCliente(user)) return null;
    
    // Verificar si hay cambios en los datos del cliente
    const hayCambios = 
      formData.telefono !== user.telefono?.toString() || 
      formData.direccion !== user.direccion;
    
    if (!hayCambios) return user;
    
    try {
      // Preparar datos a actualizar
      const datosActualizados: any = {};
      
      // Solo incluir los campos que se hayan modificado o que falten
      if (formData.telefono && formData.telefono !== user.telefono?.toString()) {
        datosActualizados.telefono = formData.telefono;
      }
      
      if (formData.direccion && formData.direccion !== user.direccion) {
        datosActualizados.direccion = formData.direccion;
      }
      
      // Si hay datos para actualizar, hacer la petición
      if (Object.keys(datosActualizados).length > 0) {
        const clienteActualizado = await clienteApiFast.update(idCliente, datosActualizados);
        console.log('Datos del cliente actualizados:', clienteActualizado);
        return clienteActualizado;
      }
      
      return user;
    } catch (error) {
      console.error('Error al actualizar datos del cliente:', error);
      // No interrumpir el flujo de compra por un error en la actualización de datos
      return user;
    }
  };

  // Si estamos en carga inicial, mostrar un indicador de carga
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="bg-gray-200 dark:bg-gray-700 h-16 w-16 rounded-full mb-4"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-6 w-40 rounded mb-2"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-4 w-60 rounded"></div>
        </div>
      </div>
    );
  }

  // Si no hay productos en el carrito, redirigir a la página de productos
  if (items.length === 0 && !checkoutSuccess) {
    return (
      <>
        <CheckoutBanner />
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
            <FaShoppingCart className="text-gray-400 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Tu carrito está vacío</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            No tienes productos en tu carrito para proceder al pago.
          </p>
          <Link
            href="/productos"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Explorar productos
          </Link>
        </div>
      </>
    );
  }

  if (checkoutSuccess) {
    return (
      <>
        <CheckoutBanner />
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-6">
            <FaCheck className="text-green-600 dark:text-green-400 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">¡Compra realizada con éxito!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Tu pedido ha sido procesado correctamente. Recibirás un correo electrónico con los detalles
            de tu compra. ¡Gracias por tu compra!
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Link
              href="/productos"
              className="inline-flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CheckoutBanner />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:space-x-8">
          {/* Formulario de checkout */}
          <div className="md:w-2/3">
            <div className="flex items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white ml-4">Checkout</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              {!user && !authLoading && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-300 mb-2">
                    ¿Ya tienes una cuenta? Accede para completar tus datos automáticamente.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={openLoginModal}
                      className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Iniciar sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openLoginModal();
                        // Pequeño timeout para asegurar que el modal está abierto antes de cambiar a registro
                        setTimeout(() => {
                          const registerTab = document.querySelector('[data-tab="register"]');
                          if (registerTab) {
                            (registerTab as HTMLElement).click();
                          }
                        }, 100);
                      }}
                      className="text-sm px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Registrarse
                    </button>
                  </div>
                </div>
              )}
              
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Información de contacto</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
                </div>
                
                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.apellido ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.apellido && <p className="mt-1 text-sm text-red-500">{errors.apellido}</p>}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>
                
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.telefono ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.telefono && <p className="mt-1 text-sm text-red-500">{errors.telefono}</p>}
                </div>

                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.direccion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.direccion && <p className="mt-1 text-sm text-red-500">{errors.direccion}</p>}
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Método de pago</h2>
              
              <div className="mb-6 space-y-4">               
                <label className="block">
                  <input
                    type="radio"
                    id="webpay"
                    name="metodoPago"
                    value="webpay"
                    checked={formData.metodoPago === 'webpay'}
                    onChange={handleInputChange}
                    className="sr-only" // Ocultamos el radio button original
                  />
                  <div className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.metodoPago === 'webpay' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-gray-700' 
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}>
                    <div className="flex items-center flex-1">
                      <Image 
                        src="/webpay.svg" 
                        alt="WebPay" 
                        width={100}
                        height={32}
                        className="mr-3"
                        style={{ height: '32px', width: 'auto' }}
                        priority
                      />
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">WebPay</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Paga de forma segura con tarjeta de crédito o débito</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                      formData.metodoPago === 'webpay'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {formData.metodoPago === 'webpay' && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </label>
                
                <label className="block">
                  <input
                    type="radio"
                    id="transferencia"
                    name="metodoPago"
                    value="transferencia"
                    checked={formData.metodoPago === 'transferencia'}
                    onChange={handleInputChange}
                    className="sr-only" // Ocultamos el radio button original
                  />
                  <div className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.metodoPago === 'transferencia' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-gray-700' 
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}>
                    <div className="flex items-center flex-1">
                      <Image 
                        src="/dinero.svg" 
                        alt="Dinero" 
                        width={100}
                        height={32}
                        className="mr-3"
                        style={{ height: '32px', width: 'auto' }}
                        priority
                      />
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Transferencia</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Realiza una transferencia directa a nuestra cuenta</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                      formData.metodoPago === 'transferencia'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {formData.metodoPago === 'transferencia' && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="md:hidden mt-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Resumen del pedido</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Productos ({items.length}):</span>
                    <span className="font-medium text-gray-800 dark:text-white">${Math.round(calcularTotal())}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Impuestos (19%):</span>
                    <span className="font-medium text-gray-800 dark:text-white">${Math.round(calcularTotal() * 0.19)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2 flex justify-between">
                    <span className="font-bold text-gray-800 dark:text-white">Total:</span>
                    <span className="font-bold text-gray-800 dark:text-white">${Math.round(calcularTotal() * 1.19 + 10)}</span>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition-colors flex justify-center items-center"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  'Finalizar compra'
                )}
              </button>
            </form>
          </div>
          
          {/* Resumen del pedido (solo en desktop) */}
          <div className="hidden md:block md:w-1/3 sticky top-4 self-start">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resumen del pedido</h2>
              
              <div className="mb-4">
                {items.map((item) => (
                  <div key={item.producto.id_producto} className="flex py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="h-16 w-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <img
                        src={`/productos/${item.producto.id_producto}.webp`}
                        alt={item.producto.nombre}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                          {item.producto.nombre}
                        </h3>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          ${Math.round(item.producto.precio * item.cantidad)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cantidad: {item.cantidad}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                  <span className="font-medium text-gray-800 dark:text-white">${Math.round(calcularTotal())}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Impuestos (19%):</span>
                  <span className="font-medium text-gray-800 dark:text-white">${Math.round(calcularTotal() * 0.19)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800 dark:text-white">Total:</span>
                  <span className="font-bold text-gray-800 dark:text-white text-lg">${Math.round(calcularTotal() * 1.19 + 10)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}