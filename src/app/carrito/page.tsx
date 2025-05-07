'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCarrito } from '@/lib/useCarrito';
import { FaTrash, FaShoppingCart, FaArrowLeft, FaCheck } from 'react-icons/fa';

export default function CarritoPage() {
  const { items, actualizarCantidad, eliminarProducto, limpiarCarrito, calcularTotal } = useCarrito();
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleCheckout = () => {
    // Aquí se implementaría la lógica de checkout real
    // Por ahora, simularemos un proceso exitoso
    setTimeout(() => {
      limpiarCarrito();
      setCheckoutSuccess(true);
    }, 1500);
  };

  if (checkoutSuccess) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <FaCheck className="text-green-600 text-2xl" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Compra realizada con éxito!</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Tu pedido ha sido procesado correctamente. Recibirás un correo electrónico con los detalles
          de tu compra.
        </p>
        <Link
          href="/productos"
          className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
          <FaShoppingCart className="text-gray-400 text-2xl" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-8">
          Parece que aún no has añadido productos a tu carrito de compras.
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Carrito de compras</h1>
        <Link
          href="/productos"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          Seguir comprando
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtotal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.producto.id_producto}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-md mr-4 flex-shrink-0 overflow-hidden">
                      <img
                        src={`https://picsum.photos/seed/${item.producto.id_producto}/100/100`}
                        alt={item.producto.nombre}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {item.producto.nombre}
                      </span>
                      <span className="text-xs text-gray-500">{item.producto.marca}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ${Math.round(item.producto.precio)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center border border-gray-300 rounded-md w-24">
                    <button
                      onClick={() => actualizarCantidad(item.producto.id_producto, item.cantidad - 1)}
                      className="px-2 py-1 border-r border-gray-300 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-2 py-1 text-center flex-grow">{item.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(item.producto.id_producto, item.cantidad + 1)}
                      disabled={item.cantidad >= item.producto.stock}
                      className="px-2 py-1 border-l border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    ${Math.round(item.producto.precio * item.cantidad)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => eliminarProducto(item.producto.id_producto)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">${Math.round(calcularTotal())}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Impuestos (19%):</span>
          <span className="font-medium">${Math.round(calcularTotal() * 0.19)}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Envío:</span>
          <span className="font-medium">$10</span>
        </div>
        <div className="border-t border-gray-200 my-4 pt-4 flex justify-between">
          <span className="text-lg font-bold">Total:</span>
          <span className="text-lg font-bold">
            ${Math.round(calcularTotal() * 1.19 + 10)}
          </span>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={limpiarCarrito}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Vaciar carrito
          </button>
          <button
            onClick={handleCheckout}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            <span>Proceder al pago</span>
            <FaCheck />
          </button>
        </div>
      </div>
    </div>
  );
} 