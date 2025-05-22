'use client';

import { Producto } from '@/lib/api';
import { useState } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';

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
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
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

  const getStockStatusClass = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = (stock: number) => {
    if (stock === 0) return 'Sin Stock';
    if (stock <= 5) return 'Stock Bajo';
    return 'Disponible';
  };

  return (
    <div>
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Barra de búsqueda */}
        <div className="relative flex w-full">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          
          {/* Botón de filtro móvil */}
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="md:hidden ml-2 px-4 bg-blue-500 text-white rounded-lg flex items-center"
          >
            <FaFilter className="mr-2" />
            Filtros
          </button>
        </div>
        
        {/* Filtros para móvil - panel desplegable */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${showFilterMenu ? 'max-h-60' : 'max-h-0'}`}>
          <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
            {/* Filtro de Estado de Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de stock</label>
              <select
                value={selectedStockState}
                onChange={(e) => setSelectedStockState(e.target.value as keyof typeof stockStates)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              >
                {Object.entries(stockStates).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Categorías */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              >
                <option value={0}>Todas las categorías</option>
                {Object.entries(categoriasMap).map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Filtros para desktop */}
        <div className="hidden md:flex gap-4">
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
      </div>

      {/* Resumen de filtros aplicados */}
      <div className="mb-4 flex flex-wrap gap-2">
        {selectedCategoria !== 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Categoría: {categoriasMap[selectedCategoria as keyof typeof categoriasMap]}
            <button 
              onClick={() => setSelectedCategoria(0)} 
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        )}
        
        {selectedStockState !== 'all' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Estado: {stockStates[selectedStockState]}
            <button 
              onClick={() => setSelectedStockState('all')} 
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        )}
        
        {searchTerm && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Búsqueda: {searchTerm}
            <button 
              onClick={() => setSearchTerm('')} 
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {/* Tabla de productos para pantallas medianas y grandes */}
      <div className="hidden md:block overflow-x-auto">
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
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusClass(producto.stock)}`}>
                    {getStockStatusText(producto.stock)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para dispositivos móviles */}
      <div className="md:hidden space-y-4">
        {filteredProductos.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
            No se encontraron productos que coincidan con los filtros aplicados.
          </div>
        ) : (
          filteredProductos.map(producto => (
            <div key={producto.id_producto} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-800">{producto.nombre}</h3>
                <span className="text-gray-500 text-sm">#{producto.id_producto}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Categoría:</span>
                  <span className="ml-2 font-medium">{categoriasMap[producto.categoria_id as keyof typeof categoriasMap] || 'Sin categoría'}</span>
                </div>
                
                <div>
                  <span className="text-gray-500">Stock:</span>
                  <span className="ml-2 font-medium">{producto.stock}</span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStockStatusClass(producto.stock)}`}>
                  {getStockStatusText(producto.stock)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 text-sm text-gray-500">
        Mostrando {filteredProductos.length} de {productos.length} productos
      </div>
    </div>
  );
}
