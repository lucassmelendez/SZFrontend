'use client';

import { useState } from 'react';
import { Producto, productoApi } from '@/lib/api';
import { FaCheck, FaExclamationTriangle, FaMinus, FaPlus } from 'react-icons/fa';

// Mapa de categorías
const categoriasMap = {
  1: 'Paletas',
  2: 'Bolsos',
  3: 'Pelotas',
  4: 'Mallas',
  5: 'Mesas',
  6: 'Gomas'
};

interface StockEditorProps {
  productos: Producto[];
  onStockUpdate?: (productoId: number, newStock: number) => void;
}

export default function StockEditor({ productos, onStockUpdate }: StockEditorProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number | null>(null);

  const handleStockEdit = (producto: Producto) => {
    setEditingId(producto.id_producto);
    setTempStock(producto.stock);
    setError(null);
    setSuccess(null);
  };

  const handleStockChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setTempStock(value);
    }
  };

  const handleStockIncrement = () => {
    if (tempStock !== null) {
      setTempStock(tempStock + 1);
    }
  };

  const handleStockDecrement = () => {
    if (tempStock !== null && tempStock > 0) {
      setTempStock(tempStock - 1);
    }
  };

  const handleStockSave = async (producto: Producto) => {
    if (tempStock === null) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProducto = await productoApi.updateStock(producto.id_producto, tempStock);
      
      // Actualizar el estado local y mostrar mensaje de éxito
      onStockUpdate?.(producto.id_producto, tempStock);
      setSuccess(`Stock actualizado correctamente a ${tempStock} unidades`);
      
      // Limpiar el estado de edición después de un breve momento
      setTimeout(() => {
        setEditingId(null);
        setTempStock(null);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError('Error al actualizar el stock. Por favor, intenta de nuevo.');
      console.error('Error al actualizar stock:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockCancel = () => {
    setEditingId(null);
    setTempStock(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div>
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center space-x-2">
          <FaCheck />
          <span>{success}</span>
        </div>
      )}

      {/* Versión móvil */}
      <div className="md:hidden space-y-4">
        {productos.map((producto) => (
          <div key={producto.id_producto} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Encabezado del producto */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">
                  {producto.nombre}
                </span>
                <span className="text-sm text-gray-500">
                  ID: #{producto.id_producto}
                </span>
              </div>
            </div>

            {/* Información del producto */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Categoría: {categoriasMap[producto.categoria_id as keyof typeof categoriasMap] || 'Sin categoría'}
                </span>
                <span className={`text-sm font-medium ${
                  producto.stock === 0
                    ? 'text-red-500'
                    : producto.stock <= 5
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}>
                  Stock: {producto.stock}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-4 py-3">
              {editingId === producto.id_producto ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleStockDecrement}
                      disabled={loading || tempStock === 0}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <FaMinus className="w-5 h-5 text-gray-600" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={tempStock ?? ''}
                      onChange={handleStockChange}
                      className="w-24 px-3 py-2 border rounded text-center text-lg"
                    />
                    <button
                      onClick={handleStockIncrement}
                      disabled={loading}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <FaPlus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStockSave(producto)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaCheck size={14} />
                      <span>{loading ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                    <button
                      onClick={handleStockCancel}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleStockEdit(producto)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  Editar stock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Versión web */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {productos.map((producto) => (
              <tr key={producto.id_producto} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{producto.id_producto}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{producto.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {categoriasMap[producto.categoria_id as keyof typeof categoriasMap] || 'Sin categoría'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === producto.id_producto ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleStockDecrement}
                        disabled={loading || tempStock === 0}
                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <FaMinus className="w-4 h-4 text-gray-600" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={tempStock ?? ''}
                        onChange={handleStockChange}
                        className="w-20 px-2 py-1 border rounded text-center"
                      />
                      <button
                        onClick={handleStockIncrement}
                        disabled={loading}
                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <FaPlus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <span className={`font-medium ${
                      producto.stock === 0
                        ? 'text-red-500'
                        : producto.stock <= 5
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`}>
                      {producto.stock}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === producto.id_producto ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStockSave(producto)}
                        disabled={loading}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaCheck size={12} />
                        <span>{loading ? 'Guardando...' : 'Guardar'}</span>
                      </button>
                      <button
                        onClick={handleStockCancel}
                        disabled={loading}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStockEdit(producto)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs"
                    >
                      Editar stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center space-x-2">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
