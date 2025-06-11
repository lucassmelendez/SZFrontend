'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Producto } from '@/lib/api';
import { apiCache } from '@/lib/apiCache';
import ProductCarousel from '@/components/ui/ProductCarousel';
import { FaArrowRight } from 'react-icons/fa';
import { GiPingPongBat, GiTable, GiBallPyramid } from 'react-icons/gi';

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        // Intentar obtener los productos más vendidos primero (con caché)
        try {
          const productosVendidos = await apiCache.getProductosMasVendidos(15);
          // Si hay productos vendidos, mostrarlos
          if (productosVendidos && productosVendidos.length > 0) {
            setProductos(productosVendidos);
            setLoading(false);
            return;
          }
        } catch (errorMasVendidos) {
          console.error('Error al obtener productos más vendidos:', errorMasVendidos);
          // Si falla, continuamos con la carga normal
        }

        // Carga normal como fallback (con caché)
        const data = await apiCache.getProductos();
        // Mostrar hasta 15 productos para el carrusel
        setProductos(data.slice(0, 15));
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('No se pudieron cargar los productos. Por favor, intenta nuevamente más tarde.');
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="relative bg-blue-700 text-white rounded-lg overflow-hidden transition-colors duration-200 h-[500px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/banner.jpg"
            alt="Tenis de mesa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/60"></div>
        </div>
        <div className="container mx-auto px-6 py-16 relative z-10 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Descubre el mejor equipamiento para tenis de mesa
            </h1>
            <p className="text-lg mb-8 text-white/90">
              Todo lo que necesitas para mejorar tu juego: raquetas, pelotas, mesas y más.
              Productos de calidad para todos los niveles.
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors"
            >
              Ver Productos <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-2 md:mx-4 lg:mx-8">
        <h2 className="text-3xl font-bold text-center mb-8">Categorías Destacadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Paletas',
              icon: <GiPingPongBat size={48} />,
              description: 'Paletas profesionales para todos los niveles',
              link: '/productos/categoria/1',
            },
            {
              title: 'Pelotas',
              icon: <GiBallPyramid size={48} />,
              description: 'Pelotas profesionales para tus entrenamientos y competiciones',
              link: '/productos/categoria/3',
            },
            {
              title: 'Mesas',
              icon: <GiTable size={48} />,
              description: 'Mesas de competición y entrenamiento',
              link: '/productos/categoria/5',
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
                Ver categoria <FaArrowRight className="ml-1" size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Productos Destacados</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <>
            <ProductCarousel productos={productos} title="" />
            <div className="flex justify-center mt-6">
              <Link
                href="/productos"
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                Ver todos los productos <FaArrowRight className="ml-1" size={14} />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Banner promocional */}
      <section className="bg-gray-100 rounded-lg p-8 text-center transition-colors duration-200">
        <h2 className="text-2xl font-bold mb-4">¿Eres nuevo en el tenis de mesa?</h2>
        <p className="text-gray-700 max-w-2xl mx-auto mb-6">
          Descubre nuestros kits para principiantes y lleva tu juego al siguiente nivel con equipamiento de calidad a precios accesibles.
        </p>
        <Link
          href="/productos"
          className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
        >
          Explorar Kits para Principiantes <FaArrowRight className="ml-2" />
        </Link>
      </section>
    </div>
  );
}
