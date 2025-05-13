'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productoApi, Producto } from '@/lib/api';
import { useCarrito } from '@/lib/useCarrito';
import Loading from '@/components/ui/Loading';
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

interface PageParams {
  id: string;
}

export default function ProductoDetailPage({ params }: { params: PageParams }) {
  const router = useRouter();
  const { agregarProducto } = useCarrito();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
          throw new Error('ID de producto inválido');
        }
        
        const data = await productoApi.getById(id);
        setProducto(data);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar el producto:', error);
        setError('No se pudo cargar el producto. Por favor, intenta nuevamente más tarde.');
        setLoading(false);
      }
    };

    fetchProducto();
  }, [params.id]);

  const handleAddToCart = () => {
    if (producto) {
      setIsAdding(true);
      agregarProducto(producto, cantidad);
      
      // Mostrar animación durante 2 segundos
      setTimeout(() => {
        setIsAdding(false);
      }, 2000);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const incrementCantidad = () => {
    if (producto && cantidad < producto.stock) {
      setCantidad(cantidad + 1);
    }
  };

  const decrementCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <FaArrowLeft />
            <span>Volver al catálogo</span>
          </button>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <FaArrowLeft />
            <span>Volver al catálogo</span>
          </button>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <FaArrowLeft />
            <span>Volver al catálogo</span>
          </button>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">No se encontró el producto.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <FaArrowLeft />
          <span>Volver al catálogo</span>
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row">
          {/* Imagen del producto */}
          <div className="md:w-1/2 md:pr-8 mb-6 md:mb-0">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={`https://picsum.photos/seed/${producto.id_producto}/600/600`}
                alt={producto.nombre}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          
          {/* Detalles del producto */}
          <div className="md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{producto.nombre}</h1>
            
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4">
              ${Math.round(producto.precio)}
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Descripción</h2>
              <p className="text-gray-700 dark:text-gray-300">{producto.descripcion}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Marca</span>
                <div className="font-medium text-gray-800 dark:text-white">{producto.marca}</div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Peso</span>
                <div className="font-medium text-gray-800 dark:text-white">{producto.peso}</div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Stock</span>
                <div className="font-medium text-gray-800 dark:text-white">{producto.stock} unidades</div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Categoría</span>
                <div className="font-medium text-gray-800 dark:text-white">ID: {producto.categoria_id}</div>
              </div>
            </div>
            
            {/* Selector de cantidad y botón para agregar al carrito */}
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <span className="mr-4 text-gray-700 dark:text-gray-300">Cantidad:</span>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                  <button
                    onClick={decrementCantidad}
                    disabled={cantidad <= 1}
                    className="px-3 py-1 border-r border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-gray-800 dark:text-white">{cantidad}</span>
                  <button
                    onClick={incrementCantidad}
                    disabled={producto.stock <= cantidad}
                    className="px-3 py-1 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={isAdding || producto.stock <= 0}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-md text-white ${
                  producto.stock <= 0
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : isAdding
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                } transition-colors`}
              >
                <FaShoppingCart />
                <span>
                  {isAdding
                    ? '¡Agregado al carrito!'
                    : producto.stock <= 0
                    ? 'Sin stock'
                    : 'Agregar al carrito'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 