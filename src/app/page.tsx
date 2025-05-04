'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productoApi, Producto } from '@/lib/api';
import Loading from '@/components/ui/Loading';
import ProductGrid from '@/components/ui/ProductGrid';
import { FaArrowRight, FaTable, FaShoppingBag, FaShieldAlt } from 'react-icons/fa';
import Image from 'next/image';

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await productoApi.getAll();
        // Mostrar solo los 8 primeros productos
        setProductos(data.slice(0, 8));
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('No se pudieron cargar los productos. Por favor, intenta nuevamente más tarde.');
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      {/* Hero section */}
      <section 
        className="w-full text-white relative"
        style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          width: '100vw',
          height: '500px',
          overflow: 'hidden'
        }}
      >
        <div className="absolute inset-0 w-full h-full">
          <Image 
            src="/Images/banner.jpg" 
            alt="Jugador de tenis de mesa" 
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div 
          className="absolute inset-0 bg-black bg-opacity-30"
        ></div>
        <div className="container mx-auto px-6 py-24 relative z-10 flex flex-col md:flex-row items-center h-full">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Descubre el mejor equipamiento para tenis de mesa
            </h1>
            <p className="text-lg mb-8">
              Todo lo que necesitas para mejorar tu juego: raquetas, pelotas, mesas y más.
              Productos de calidad para todos los niveles.
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors"
            >
              Ver Catálogo <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Categorías */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">Categorías Destacadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Raquetas',
                icon: <FaTable size={40} />,
                description: 'Raquetas profesionales para todos los niveles',
                link: '/productos/categoria/1',
              },
              {
                title: 'Accesorios',
                icon: <FaShoppingBag size={40} />,
                description: 'Pelotas, fundas y todo lo que necesitas',
                link: '/productos/categoria/2',
              },
              {
                title: 'Mesas',
                icon: <FaShieldAlt size={40} />,
                description: 'Mesas de competición y entrenamiento',
                link: '/productos/categoria/3',
              },
            ].map((category, index) => (
              <Link
                key={index}
                href={category.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
              >
                <div className="text-blue-600 mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <span className="text-blue-600 font-medium inline-flex items-center">
                  Ver productos <FaArrowRight className="ml-1" size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Productos destacados */}
        {error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Productos Destacados</h2>
              <Link
                href="/productos"
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                Ver todos <FaArrowRight className="ml-1" size={14} />
              </Link>
            </div>
            <ProductGrid productos={productos} />
          </section>
        )}

        {/* Banner promocional */}
        <section className="bg-gray-100 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Eres nuevo en el tenis de mesa?</h2>
          <p className="text-gray-700 max-w-2xl mx-auto mb-6">
            Descubre nuestros kits para principiantes y lleva tu juego al siguiente nivel con equipamiento de calidad a precios accesibles.
          </p>
          <Link
            href="/productos/categoria/4"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Explorar Kits para Principiantes <FaArrowRight className="ml-2" />
          </Link>
        </section>
      </div>
    </div>
  );
}
