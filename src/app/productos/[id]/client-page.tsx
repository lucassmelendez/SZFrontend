'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productoApi, Producto } from '@/lib/api';
import { useCarrito } from '@/lib/useCarrito';
import { FaShoppingCart, FaCreditCard, FaTimesCircle, FaExclamationCircle, FaCheckCircle, FaShieldAlt, FaTruck } from 'react-icons/fa';
import Image from 'next/image';
import { useFloatingCartContext } from '@/lib/FloatingCartContext';

// Mapa de categorías
const categoriasMap = {
  1: 'Paletas',
  2: 'Bolsos',
  3: 'Pelotas',
  4: 'Mallas',
  5: 'Mesas',
  6: 'Gomas'
};

interface ProductoDetailClientProps {
  id: string;
}

export function ProductoDetailClient({ id }: ProductoDetailClientProps) {
  const router = useRouter();
  const { agregarProducto } = useCarrito();
  const { openCart, isCartOpen } = useFloatingCartContext();
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
      
      // Abrir el carrito flotante después de agregar el producto
      setTimeout(() => {
        openCart(); // Abre el carrito flotante
        
        // Mostrar animación durante 2 segundos
        setTimeout(() => {
          setIsAdding(false);
        }, 1500);
      }, 300);
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
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
          <div className="text-red-600 mb-4">No se encontró el producto.</div>
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

  // Imágenes de muestra para la galería (usando las imágenes de productos reales)
  const productImages = [
    `/productos/${producto.id_producto}.webp`,
    `/productos/${producto.id_producto}.webp`, // Usar la misma imagen para todas las vistas
    `/productos/${producto.id_producto}.webp`,
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Galería de imágenes del producto */}
          <div className="md:w-1/2 p-6">
            <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-4 transition-all duration-300 hover:shadow-lg aspect-square">
              <Image
                src={productImages[selectedImage]}
                alt={producto.nombre}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>
            
            {/* Miniaturas */}
            <div className="flex gap-2 justify-center">
              {productImages.map((img, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative ${
                    selectedImage === index 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-transparent hover:border-blue-300'
                  }`}
                >
                  <Image 
                    src={img} 
                    alt={`Vista ${index + 1}`} 
                    fill
                    sizes="80px"
                    className="object-cover" 
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Detalles del producto */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{producto.nombre}</h1>
            
            <div className="text-3xl font-bold text-blue-700 mb-4">
              ${producto.precio.toLocaleString('es-CL')}
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{producto.descripcion}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-sm block mb-1">Marca</span>
                <div className="font-medium text-gray-800">{producto.marca}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-sm block mb-1">Peso</span>
                <div className="font-medium text-gray-800">{producto.peso}</div>
              </div>              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-500 text-sm">Stock</span>
                  {producto.stock <= 5 && producto.stock > 0 && (
                    <span className="text-yellow-500 text-sm font-medium">¡Últimas unidades!</span>
                  )}
                </div>
                <div className="font-medium text-gray-800">
                  {producto.stock === 0 ? (
                    <span className="text-red-500 flex items-center">
                      <FaTimesCircle className="text-red-500 mr-1" size={14} />
                      Agotado
                    </span>
                  ) : producto.stock <= 5 ? (
                    <span className="text-yellow-500 flex items-center">
                      <FaExclamationCircle className="text-yellow-500 mr-1" size={14} />
                      {producto.stock} unidades
                    </span>
                  ) : (
                    <span className="text-green-500 flex items-center">
                      <FaCheckCircle className="text-green-500 mr-1" size={14} />
                      {producto.stock} unidades
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-sm block mb-1">Categoría</span>
                <div className="font-medium text-gray-800">
                  {categoriasMap[producto.categoria_id as keyof typeof categoriasMap] || 'Sin categoría'}
                </div>
              </div>
            </div>
            
            {/* Separador */}
            <div className="border-t border-gray-200 my-4"></div>
            {/* Selector de cantidad y botón para agregar al carrito */}
            <div className="mt-3 mb-5">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0 md:space-x-4">
                <div className="flex items-center bg-gray-50 p-3 rounded-lg w-full md:w-auto hidden md:flex">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full">
                    <button
                      onClick={decrementCantidad}
                      disabled={cantidad <= 1 || producto.stock <= 0}
                      className="px-5 py-3 border-r border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-gray-700 text-lg"
                    >
                      -
                    </button>
                    <span className="px-5 py-3 text-gray-800 font-medium min-w-[40px] text-center text-lg">{cantidad}</span>
                    <button
                      onClick={incrementCantidad}
                      disabled={producto.stock <= cantidad || producto.stock <= 0}
                      className="px-5 py-3 border-l border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-gray-700 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || producto.stock <= 0}
                  className={`flex items-center justify-center space-x-2 py-3 px-6 rounded-lg text-white w-full md:w-auto md:flex-1 hidden md:flex ${
                    producto.stock <= 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isAdding
                      ? 'bg-green-500'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors font-medium text-lg`}
                >
                  <FaShoppingCart size={20} />
                  <span>
                    {isAdding
                      ? '¡Agregado!'
                      : producto.stock <= 0
                      ? 'Sin stock'
                      : 'Agregar al carrito'}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Medios de pago */}
            <div className="mb-5">
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-gray-800 font-medium mb-3">Medios de pago</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="relative h-8 w-20">
                    <Image 
                      src="/webpay.svg" 
                      alt="Webpay" 
                      width={80}
                      height={32}
                      style={{ objectFit: 'contain', width: 'auto', height: '100%' }}
                    />
                  </div>
                  <div className="relative h-8 w-12">
                    <Image 
                      src="/visa.svg" 
                      alt="Visa" 
                      width={48}
                      height={32}
                      style={{ objectFit: 'contain', width: 'auto', height: '100%' }}
                    />
                  </div>
                  <div className="relative h-8 w-12">
                    <Image 
                      src="/mastercard.svg" 
                      alt="Mastercard" 
                      width={48}
                      height={32}
                      style={{ objectFit: 'contain', width: 'auto', height: '100%' }}
                    />
                  </div>
                  <div className="relative h-8 w-20">
                    <Image 
                      src="/redcompra.svg" 
                      alt="Redcompra" 
                      width={80}
                      height={32}
                      style={{ objectFit: 'contain', width: 'auto', height: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Add to Cart para móviles */}
      {producto && (
        <div 
          className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-3 md:hidden ${
            isCartOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 z-50'
          } transition-opacity duration-300`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={decrementCantidad}
                disabled={cantidad <= 1 || producto.stock <= 0}
                className="px-3 py-2 border-r border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-gray-700"
              >
                -
              </button>
              <span className="px-3 py-1 text-gray-800 font-medium min-w-[30px] text-center">{cantidad}</span>
              <button
                onClick={incrementCantidad}
                disabled={producto.stock <= cantidad || producto.stock <= 0}
                className="px-3 py-2 border-l border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-gray-700"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdding || producto.stock <= 0}
              className={`flex items-center justify-center space-x-1 py-2 px-6 rounded-lg text-white flex-1 ml-3 ${
                producto.stock <= 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isAdding
                  ? 'bg-green-500'
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors font-medium`}
            >
              <FaShoppingCart size={16} />
              <span>
                {isAdding
                  ? '¡Agregado!'
                  : producto.stock <= 0
                  ? 'Sin stock'
                  : 'Agregar'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}