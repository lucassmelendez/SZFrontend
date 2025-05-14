'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productoApi, Producto } from '@/lib/api';
import { useCarrito } from '@/lib/useCarrito';
import { FaShoppingCart, FaCreditCard, FaCheckCircle, FaShieldAlt, FaTruck } from 'react-icons/fa';
import Image from 'next/image';

interface ProductoDetailClientProps {
  id: string;
}

export function ProductoDetailClient({ id }: ProductoDetailClientProps) {
  const router = useRouter();
  const { agregarProducto } = useCarrito();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const productoId = parseInt(id, 10);
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
  }, [id]);

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
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.push('/productos')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver otros productos
          </button>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">No se encontró el producto.</div>
          <button
            onClick={() => router.push('/productos')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver otros productos
          </button>
        </div>
      </div>
    );
  }

  // Imágenes de muestra para la galería
  const sampleImages = [
    `https://picsum.photos/seed/${producto.id_producto}/600/600`,
    `https://picsum.photos/seed/${producto.id_producto + 100}/600/600`,
    `https://picsum.photos/seed/${producto.id_producto + 200}/600/600`,
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Galería de imágenes del producto */}
          <div className="md:w-1/2 p-6">
            <div className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-4 transition-all duration-300 hover:shadow-lg">
              <img
                src={sampleImages[selectedImage]}
                alt={producto.nombre}
                className="w-full h-auto object-cover aspect-square"
              />
            </div>
            
            {/* Miniaturas */}
            <div className="flex gap-2 justify-center">
              {sampleImages.map((img, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedImage === index 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-transparent hover:border-blue-300'
                  }`}
                >
                  <img src={img} alt={`Vista ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Detalles del producto */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">{producto.nombre}</h1>
            
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-4">
              ${producto.precio.toLocaleString('es-CL')}
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{producto.descripcion}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Marca</span>
                <div className="font-medium text-gray-800 dark:text-white">{producto.marca}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Peso</span>
                <div className="font-medium text-gray-800 dark:text-white">{producto.peso}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Stock</span>
                <div className="font-medium text-gray-800 dark:text-white">
                  {producto.stock > 0 ? (
                    <span className="flex items-center">
                      <FaCheckCircle className="text-green-500 mr-1" size={14} />
                      {producto.stock} unidades
                    </span>
                  ) : (
                    <span className="text-red-500">Agotado</span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Categoría</span>
                <div className="font-medium text-gray-800 dark:text-white">Tenis de Mesa</div>
              </div>
            </div>
            
            {/* Selector de cantidad y botón para agregar al carrito */}
            <div className="mt-auto">
              <div className="flex items-center mb-4">
                <span className="mr-4 text-gray-700 dark:text-gray-300">Cantidad:</span>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={decrementCantidad}
                    disabled={cantidad <= 1 || producto.stock <= 0}
                    className="px-4 py-2 border-r border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-800 dark:text-white font-medium min-w-[40px] text-center">{cantidad}</span>
                  <button
                    onClick={incrementCantidad}
                    disabled={producto.stock <= cantidad || producto.stock <= 0}
                    className="px-4 py-2 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={isAdding || producto.stock <= 0}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg text-white ${
                  producto.stock <= 0
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : isAdding
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                } transition-colors text-lg font-medium`}
              >
                <FaShoppingCart size={18} />
                <span>
                  {isAdding
                    ? '¡Agregado al carrito!'
                    : producto.stock <= 0
                    ? 'Sin stock'
                    : 'Agregar al carrito'}
                </span>
              </button>
              
              {/* Medios de pago y beneficios */}
              <div className="mt-8">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-800 dark:text-white font-medium">Medios de pago</h3>
                    <div className="relative h-6 w-24">
                      <Image 
                        src="/webpay.svg" 
                        alt="Webpay" 
                        width={100}
                        height={30}
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <FaTruck className="text-blue-600 dark:text-blue-400" />
                    <span>Entrega a domicilio</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <FaShieldAlt className="text-blue-600 dark:text-blue-400" />
                    <span>Compra protegida</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <FaCreditCard className="text-blue-600 dark:text-blue-400" />
                    <span>Pago seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 