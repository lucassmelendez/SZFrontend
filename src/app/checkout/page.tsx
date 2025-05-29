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
import { pedidoApiFast, pedidoProductoApiFast, PedidoProducto, isCliente, clienteApiFast, isEmpleado } from '@/lib/api';
import { Suspense } from 'react';
import Price from '@/components/Price';

export default function CheckoutPage() {  const router = useRouter();
  const { items, limpiarCarrito, calcularTotal, calcularSubtotal, calcularDescuento } = useCarrito();
  const { closeCart } = useFloatingCartContext();
  const { user, isLoading: authLoading } = useAuth();
  const { openLoginModal, openRegisterModal } = useLoginModal();
  const [loading, setLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastOrderId, setLastOrderId] = useState<string>('');
  const [lastOrderAmount, setLastOrderAmount] = useState<number>(0);
  
  // Formulario de checkout
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    metodoPago: 'webpay'
  });
  
  // Validación del formulario
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Redirigir a los empleados a la página principal ya que no deben acceder al checkout
  useEffect(() => {
    if (!authLoading && user && isEmpleado(user)) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  // Asegurarnos de que la página tiene tiempo para cargar los datos del carrito
  useEffect(() => {
    // Pequeño delay para asegurar que useCarrito haya cargado los datos
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    
    closeCart();

    return () => clearTimeout(timer);
  }, [closeCart]);
  
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
  
  // Cargar los datos del pedido desde sessionStorage cuando la página se carga
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedOrderId = sessionStorage.getItem('lastOrderId');
      const storedOrderAmount = sessionStorage.getItem('lastOrderAmount');
      
      if (storedOrderId && !lastOrderId) {
        setLastOrderId(storedOrderId);
      }
      
      if (storedOrderAmount && lastOrderAmount === 0) {
        setLastOrderAmount(parseFloat(storedOrderAmount));
      }
    }
  }, [lastOrderId, lastOrderAmount]);
  
  // Si el usuario es un empleado, no mostrar la página de checkout
  if (!authLoading && user && isEmpleado(user)) {
    return null; // No renderizamos nada mientras se redirecciona
  }
  
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
      openRegisterModal();
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
      try {
        const clienteActualizado = await actualizarDatosCliente(user.id_cliente);
        console.log('Datos del cliente actualizados correctamente', clienteActualizado);
      } catch (error) {
        console.error('Error al actualizar datos del cliente pero continuando con el pedido:', error);
        // Continuamos con el proceso aunque la actualización falle
      }
      
      // Si el método de pago es transferencia, crear pedido
      if (formData.metodoPago === 'transferencia') {
        try {
          console.log("Iniciando proceso de creación de pedido con transferencia");
          
          // Datos para crear el pedido (usando una fecha estática para evitar problemas)
          const datosPedido = {
            fecha: new Date().toISOString().split('T')[0], // Usar la fecha actual en formato YYYY-MM-DD
            medio_pago_id: 1, // ID para transferencia
            id_estado_envio: 2, // Estado de envío 2
            id_estado: 2, // Estado de pedido 2
            id_cliente: user.id_cliente
          };
          
          // Intentamos crear el pedido a través de la API
          try {
            console.log("Intentando crear pedido con la API:", datosPedido);
            const nuevoPedido = await pedidoApiFast.create(datosPedido);
            console.log("Pedido creado exitosamente con la API:", nuevoPedido);
            
            // Agregar los productos al pedido
            try {
              if (!nuevoPedido.id_pedido) {
                throw new Error("El pedido creado no tiene un ID válido");
              }
              
              // Preparar los productos para guardar en la relación pedido-producto
              const productosParaPedido = items.map(item => ({
                cantidad: item.cantidad,
                precio_unitario: item.producto.precio,
                subtotal: item.producto.precio * item.cantidad,
                id_pedido: nuevoPedido.id_pedido as number,
                id_producto: item.producto.id_producto
              }));
              
              console.log("Agregando productos al pedido:", productosParaPedido);
              
              // Guardar los productos usando la función de addBulk
              const productosGuardados = await pedidoProductoApiFast.addBulk(nuevoPedido.id_pedido, productosParaPedido);
              console.log("Productos agregados exitosamente al pedido:", productosGuardados);
            } catch (productosError) {
              console.error("Error al añadir productos al pedido, pero el pedido fue creado:", productosError);
              // Continuamos aunque no se puedan guardar los productos para no detener el flujo
            }
            
            // Si llegamos aquí, el pedido se creó correctamente
            if (nuevoPedido.id_pedido) {
              // Guardar el ID del pedido en sessionStorage y en el estado
              const pedidoId = nuevoPedido.id_pedido.toString();
              sessionStorage.setItem('lastOrderId', pedidoId);
              setLastOrderId(pedidoId);
              
              // Guardar el monto total para mostrarlo en la página de confirmación
              const montoTotal = calcularTotal();
              sessionStorage.setItem('lastOrderAmount', montoTotal.toString());
              setLastOrderAmount(montoTotal);
            }
            
            limpiarCarrito();
            setCheckoutSuccess(true);
          } catch (apiError) {
            // Manejar error al crear pedido
            console.error("Error al crear pedido con la API:", apiError);
            alert("No se pudo procesar el pedido. Por favor, inténtalo de nuevo más tarde.");
          }
        } catch (error: any) {
          console.error('Error general al procesar el pedido:', error);
          alert(`Error en el proceso de pedido: ${error.message || 'Error desconocido'}`);
        }
      } else if (formData.metodoPago === 'webpay') {
        // Procesar pago con WebPay
        try {
          // Importar el servicio de WebPay dinámicamente para evitar problemas de SSR
          const { iniciarTransaccion } = await import('@/services/webpayService');
            // Calcular monto total con descuento si aplica (ya incluye IVA)
          const montoTotal = Math.round(calcularTotal());
          
          // Preparar información de los productos para la transacción
          const itemsParaWebpay = items.map(item => ({
            id: item.producto.id_producto,
            nombre: item.producto.nombre,
            cantidad: item.cantidad,
            precio: item.producto.precio
          }));
          
          console.log('Iniciando transacción WebPay con usuario ID:', user.id_cliente.toString());
          
          // Iniciar transacción en WebPay
          try {
            const transaccion = await iniciarTransaccion(
              montoTotal,
              itemsParaWebpay,
              user.id_cliente.toString()
            );
            
            console.log('Transacción iniciada correctamente:', {
              url: transaccion.url,
              token: transaccion.token ? transaccion.token.substring(0, 10) + '...' : 'No hay token'
            });
            
            // Redirección directa a WebPay
            if (transaccion.url && transaccion.token) {
              // Crear y enviar el formulario automáticamente
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = transaccion.url;
              
              const tokenInput = document.createElement('input');
              tokenInput.type = 'hidden';
              tokenInput.name = 'token_ws';
              tokenInput.value = transaccion.token;
              
              form.appendChild(tokenInput);
              document.body.appendChild(form);
              form.submit();
              return;
            }
            
            // Mostrar un mensaje si no se pudo redirigir
            console.error('No se pudo redirigir a WebPay: URL o token no válidos');
            throw new Error('No se pudo redirigir a WebPay: URL o token no válidos');
            
          } catch (webpayError: any) {
            console.error('Error específico en transacción WebPay:', webpayError);
            
            // Método alternativo para pruebas si hay problemas con WebPay
            if (process.env.NODE_ENV !== 'production') {
              alert(`Error con WebPay. En ambiente de desarrollo, simulando compra exitosa.`);
              // Guardar información para la página de confirmación
              const montoTotal = calcularTotal();
              const pedidoId = 'WP-' + Date.now().toString().substring(8);
              
              sessionStorage.setItem('lastOrderAmount', montoTotal.toString());
              sessionStorage.setItem('lastOrderId', pedidoId);
              
              setLastOrderAmount(montoTotal);
              setLastOrderId(pedidoId);
              
              setTimeout(() => {
                limpiarCarrito();
                setCheckoutSuccess(true);
                setLoading(false);
              }, 2000);
              return;
            } else {
              throw webpayError; // Relanzar el error en producción
            }
          }
        } catch (error: any) {
          console.error('Error al iniciar transacción con WebPay:', error);
          alert(`Error al iniciar transacción: ${error.message || 'Error desconocido'}`);
          setLoading(false);
        }
      } else {
        // Otro método de pago
        // Guardar información para la página de confirmación
        const montoTotal = calcularTotal();
        const pedidoId = 'OMP-' + Date.now().toString().substring(8);
        
        sessionStorage.setItem('lastOrderAmount', montoTotal.toString());
        sessionStorage.setItem('lastOrderId', pedidoId);
        
        setLastOrderAmount(montoTotal);
        setLastOrderId(pedidoId);
        
        setTimeout(() => {
          limpiarCarrito();
          setCheckoutSuccess(true);
          setLoading(false);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error al procesar el pedido:', error);
      alert(`Hubo un error al procesar tu pedido: ${error.message || 'Error desconocido'}`);
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
          <div className="bg-gray-200 h-16 w-16 rounded-full mb-4"></div>
          <div className="bg-gray-200 h-6 w-40 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 w-60 rounded"></div>
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
            <FaShoppingCart className="text-gray-400 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
          <p className="text-gray-600 mb-8">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <FaCheck className="text-green-600 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Compra realizada con éxito!</h1>
          <p className="text-gray-600 mb-4">
            Tu pedido ha sido procesado correctamente. Para completar la compra, realiza una transferencia con los siguientes datos:
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Datos de Transferencia</h3>
            <ul className="space-y-2 text-gray-700">
              <li><span className="font-medium">Banco:</span> Banco Estado</li>
              <li><span className="font-medium">Tipo de Cuenta:</span> Cuenta Corriente</li>
              <li><span className="font-medium">Número de Cuenta:</span> 12345678</li>
              <li><span className="font-medium">RUT:</span> 12.345.678-9</li>
              <li><span className="font-medium">Nombre:</span> SpinZone SpA</li>
              <li><span className="font-medium">Correo:</span> pagos@spinzone.cl</li>
              <li><span className="font-medium">Monto:</span> <Price amount={lastOrderAmount} /></li>
              <li><span className="font-medium">Asunto:</span> Pedido #{lastOrderId || sessionStorage.getItem('lastOrderId') || 'número de pedido'}</li>
            </ul>
          </div>
          
          <p className="text-gray-600 mb-8">
            Una vez realizada la transferencia, envía el comprobante al correo pagos@spinzone.cl o al WhatsApp +56 9 1234 5678 indicando tu número de pedido.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Link
              href="/productos"
              className="inline-flex items-center justify-center bg-gray-200 text-gray-800 px-6 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors"
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
              <h1 className="text-2xl font-bold text-gray-800 ml-4">Checkout</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
              {!user && !authLoading ? (
                // Mostrar solo el botón de iniciar sesión si no hay usuario autenticado
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold mb-3 text-gray-800">Inicia sesión para continuar</h2>
                    <p className="text-gray-600">
                      Para completar tu compra, primero debes iniciar sesión o crear una cuenta.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-xs sm:max-w-md">
                    <button
                      type="button"
                      onClick={openLoginModal}
                      className="w-full px-6 py-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors text-base"
                    >
                      Iniciar sesión
                    </button>
                    <button
                      type="button"
                      onClick={openRegisterModal}
                      className="w-full px-6 py-4 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors text-base"
                    >
                      Registrarse
                    </button>
                  </div>
                </div>
              ) : (
                // Mostrar el formulario completo solo si el usuario está autenticado
                <>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Información de contacto</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.nombre ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="apellido"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.apellido ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.apellido && <p className="mt-1 text-sm text-red-500">{errors.apellido}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.telefono ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.telefono && <p className="mt-1 text-sm text-red-500">{errors.telefono}</p>}
                    </div>

                    <div>
                      <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.direccion ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.direccion && <p className="mt-1 text-sm text-red-500">{errors.direccion}</p>}
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Método de pago</h2>
                  
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
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
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
                            <p className="font-medium text-gray-700">WebPay</p>
                            <p className="text-sm text-gray-500">Paga de forma segura con tarjeta de crédito o débito</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                          formData.metodoPago === 'webpay'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
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
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
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
                            <p className="font-medium text-gray-700">Transferencia</p>
                            <p className="text-sm text-gray-500">Realiza una transferencia directa a nuestra cuenta</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                          formData.metodoPago === 'transferencia'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.metodoPago === 'transferencia' && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="md:hidden mt-6">
                    <div className="bg-gray-100 p-4 rounded-md mb-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Resumen del pedido</h3>                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal (19% IVA incluido):</span>
                        <span className="font-medium text-gray-800"><Price amount={Math.round(calcularSubtotal())} /></span>
                      </div>
                      {calcularDescuento() > 0 && (
                        <div className="flex justify-between text-sm text-green-600 mb-2">
                          <span>5% de descuento:</span>
                          <span>-<Price amount={Math.round(calcularSubtotal() * calcularDescuento())} /></span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 my-2 pt-2 flex justify-between">
                        <span className="font-bold text-gray-800">Total:</span>
                        <span className="font-bold text-gray-800"><Price amount={Math.round(calcularTotal())} /></span>
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
                </>
              )}
            </form>
          </div>
          
          {/* Resumen del pedido (solo en desktop) */}
          <div className="hidden md:block md:w-1/3 sticky top-4 self-start">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Resumen del pedido</h2>
              
              <div className="mb-4">
                {items.map((item) => (
                  <div key={item.producto.id_producto} className="flex py-2 border-b border-gray-200">
                    <div className="h-16 w-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                      <img
                        src={`/productos/${item.producto.id_producto}.webp`}
                        alt={item.producto.nombre}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-800">
                          {item.producto.nombre}
                        </h3>
                        <span className="text-sm font-medium text-gray-800">
                          <Price amount={Math.round(item.producto.precio * item.cantidad)} size="sm" />
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.cantidad}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
                <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal (19% IVA incluido):</span>
                  <span className="font-medium text-gray-800"><Price amount={Math.round(calcularSubtotal())} /></span>
                </div>
                {calcularDescuento() > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-2">
                    <span>5% de descuento:</span>
                    <span>-<Price amount={Math.round(calcularSubtotal() * calcularDescuento())} /></span>
                  </div>
                )}
                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">Total:</span>
                  <span className="font-bold text-gray-800 text-lg"><Price amount={Math.round(calcularTotal())} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Función auxiliar para crear y enviar el formulario WebPay manualmente
export function createAndSubmitWebpayForm(url: string, token: string) {
  console.log('Creando formulario WebPay manualmente:', { url, token });
  
  // Crear el formulario
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.style.display = 'block'; // Mostrar el formulario para debug
  form.style.margin = '20px auto';
  form.style.padding = '20px';
  form.style.border = '1px solid #ccc';
  form.style.borderRadius = '5px';
  form.style.maxWidth = '500px';
  
  // Crear un título
  const title = document.createElement('h2');
  title.textContent = 'Redireccionando a WebPay...';
  title.style.textAlign = 'center';
  title.style.marginBottom = '20px';
  form.appendChild(title);
  
  // Crear el input para el token
  const tokenInput = document.createElement('input');
  tokenInput.type = 'hidden';
  tokenInput.name = 'token_ws';
  tokenInput.value = token;
  form.appendChild(tokenInput);
  
  // Añadir la información visible para el usuario
  const info = document.createElement('p');
  info.textContent = 'Serás redirigido automáticamente a la página de pago. Si no eres redirigido, haz clic en el botón a continuación.';
  info.style.marginBottom = '20px';
  form.appendChild(info);
  
  // Añadir un botón visible
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Ir a WebPay';
  button.style.backgroundColor = '#0070f3';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '10px 20px';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.width = '100%';
  form.appendChild(button);
  
  // Limpiar el contenido existente y agregar el formulario
  document.body.innerHTML = '';
  document.body.appendChild(form);
  
  // Enviar el formulario automáticamente después de un breve retraso
  setTimeout(() => {
    console.log('Enviando formulario WebPay automaticamente...');
    form.submit();
  }, 1500);
  
  return form;
}