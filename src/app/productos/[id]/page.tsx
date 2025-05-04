'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productoApi, Producto } from '@/lib/api';
import { useCarrito } from '@/lib/useCarrito';
import Loading from '@/components/ui/Loading';
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

interface ProductoDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductoDetailPage({ params }: ProductoDetailPageProps) {
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
        const productoId = parseInt(params.id, 10);
        if (isNaN(productoId)) {
          throw new Error('ID de producto inválido');
        }
        
        const data = await productoApi.getById(productoId);
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

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={handleGoBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft />
          <span>Volver al catálogo</span>
        </button>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-800 mb-4">Producto no encontrado</div>
        <button
          onClick={handleGoBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft />
          <span>Volver al catálogo</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleGoBack}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <FaArrowLeft />
        <span>Volver al catálogo</span>
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Imagen del producto */}
          <div className="md:w-1/2">
            <div className="bg-gray-200 aspect-square rounded-md flex items-center justify-center overflow-hidden">
              <img
                src={`https://picsum.photos/seed/${producto.id_producto}/800/800`}
                alt={producto.nombre}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Detalles del producto */}
          <div className="md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{producto.nombre}</h1>
            
            <div className="text-2xl font-bold text-blue-700 mb-4">
              ${producto.precio.toFixed(2)}
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Descripción</h2>
              <p className="text-gray-700">{producto.descripcion}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-500 text-sm">Marca</span>
                <div className="font-medium">{producto.marca}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Peso</span>
                <div className="font-medium">{producto.peso}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Stock</span>
                <div className="font-medium">{producto.stock} unidades</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Categoría</span>
                <div className="font-medium">ID: {producto.categoria_id}</div>
              </div>
            </div>
            
            {/* Selector de cantidad y botón para agregar al carrito */}
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <span className="mr-4">Cantidad:</span>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decrementCantidad}
                    disabled={cantidad <= 1}
                    className="px-3 py-1 border-r border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="px-4 py-1">{cantidad}</span>
                  <button
                    onClick={incrementCantidad}
                    disabled={producto.stock <= cantidad}
                    className="px-3 py-1 border-l border-gray-300 hover:bg-gray-100 disabled:opacity-50"
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
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isAdding
                    ? 'bg-green-500'
                    : 'bg-blue-600 hover:bg-blue-700'
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