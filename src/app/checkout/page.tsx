'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaCheck, FaShoppingCart } from 'react-icons/fa';
import { useCarrito } from '@/lib/useCarrito';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, limpiarCarrito, calcularTotal } = useCarrito();
  const [loading, setLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  
  // Formulario de checkout
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    telefono: '',
    metodoPago: 'tarjeta'
  });

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
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es requerida';
    if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
    if (!formData.codigoPostal.trim()) newErrors.codigoPostal = 'El código postal es requerido';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Simular procesamiento del pago
    setTimeout(() => {
      setLoading(false);
      setCheckoutSuccess(true);
      limpiarCarrito();
    }, 2000);
  };

  // Si no hay productos en el carrito, redirigir a la página de productos
  if (items.length === 0 && !checkoutSuccess) {
    return (
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
    );
  }

  if (checkoutSuccess) {
    return (
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
            href="/"
            className="inline-flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            href="/productos"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:space-x-8">
        {/* Formulario de checkout */}
        <div className="md:w-2/3">
          <div className="flex items-center mb-6">
            <Link href="/productos" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              <FaArrowLeft className="mr-2" />
              <span>Seguir comprando</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white ml-4">Checkout</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
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
            </div>
            
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Dirección de envío</h2>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.ciudad ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.ciudad && <p className="mt-1 text-sm text-red-500">{errors.ciudad}</p>}
                </div>
                
                <div>
                  <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    id="codigoPostal"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.codigoPostal ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.codigoPostal && <p className="mt-1 text-sm text-red-500">{errors.codigoPostal}</p>}
                </div>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Método de pago</h2>
            
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  id="tarjeta"
                  name="metodoPago"
                  value="tarjeta"
                  checked={formData.metodoPago === 'tarjeta'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="tarjeta" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tarjeta de crédito/débito
                </label>
              </div>
              
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  id="paypal"
                  name="metodoPago"
                  value="paypal"
                  checked={formData.metodoPago === 'paypal'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="paypal" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  PayPal
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="transferencia"
                  name="metodoPago"
                  value="transferencia"
                  checked={formData.metodoPago === 'transferencia'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="transferencia" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Transferencia bancaria
                </label>
              </div>
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
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Envío:</span>
                  <span className="font-medium text-gray-800 dark:text-white">$10</span>
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
                      src={`https://picsum.photos/seed/${item.producto.id_producto}/100/100`}
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
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300">Envío:</span>
                <span className="font-medium text-gray-800 dark:text-white">$10</span>
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
  );
} 