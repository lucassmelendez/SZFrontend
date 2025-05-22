'use client';

import { Producto } from '@/lib/api';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

// Mapa de categorías
const categoriasMap = {
  1: 'Paletas',
  2: 'Bolsos',
  3: 'Pelotas',
  4: 'Mallas',
  5: 'Mesas',
  6: 'Gomas'
};

interface StockViewerProps {
  productos: Producto[];
}

export default function StockViewer({ productos }: StockViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number>(0);
  const [showCategorias, setShowCategorias] = useState(false);
  // Estados de stock
  const stockStates = {
    all: 'Todos',
    out: 'Sin Stock',
    low: 'Stock Bajo',
    available: 'Disponible'
  };

  const [selectedStockState, setSelectedStockState] = useState<keyof typeof stockStates>('all');

  // Filtrar productos
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = selectedCategoria === 0 || producto.categoria_id === selectedCategoria;
    
    // Filtro por estado de stock
    const matchesStockState = selectedStockState === 'all' ||
      (selectedStockState === 'out' && producto.stock === 0) ||
      (selectedStockState === 'low' && producto.stock > 0 && producto.stock <= 5) ||
      (selectedStockState === 'available' && producto.stock > 5);

    return matchesSearch && matchesCategoria && matchesStockState;
  });

  return (
    <div>      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-md">
        {/* Barra de búsqueda */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        {/* Filtro de Estado de Stock */}
        <div className="relative">
          <select
            value={selectedStockState}
            onChange={(e) => setSelectedStockState(e.target.value as keyof typeof stockStates)}
            className="w-full md:w-auto px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
          >
            {Object.entries(stockStates).map(([key, value]) => (
              <option key={key} value={key} className="py-2">
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Categorías */}
        <div className="relative">
          <button
            onClick={() => setShowCategorias(!showCategorias)}
            className="w-full md:w-auto px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
          >
            <span>
              {selectedCategoria === 0 ? 'Todas las categorías' : categoriasMap[selectedCategoria as keyof typeof categoriasMap]}
            </span>
          </button>
          
          {showCategorias && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
              <div className="py-1">
                <button
                  onClick={() => {
                    setSelectedCategoria(0);
                    setShowCategorias(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  Todas las categorías
                </button>
                {Object.entries(categoriasMap).map(([id, nombre]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setSelectedCategoria(Number(id));
                      setShowCategorias(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    {nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProductos.map(producto => (
              <tr key={producto.id_producto}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{producto.id_producto}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {producto.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {categoriasMap[producto.categoria_id as keyof typeof categoriasMap] || 'Sin categoría'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {producto.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    producto.stock === 0
                      ? 'bg-red-100 text-red-800'
                      : producto.stock <= 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {producto.stock === 0 ? 'Sin Stock' : producto.stock <= 5 ? 'Stock Bajo' : 'Disponible'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
