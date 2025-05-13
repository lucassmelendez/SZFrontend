'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productoApi, Producto } from '@/lib/api';
import Loading from '@/components/ui/Loading';
import ProductGrid from '@/components/ui/ProductGrid';
import { FaArrowRight, FaTable, FaShoppingBag, FaShieldAlt } from 'react-icons/fa';

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
    <div className="space-y-12">
      {/* Hero section */}
      <section className="relative bg-blue-700 dark:bg-blue-900 text-white rounded-lg overflow-hidden transition-colors duration-200 h-[500px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/banner.jpg"
            alt="Tenis de mesa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/60 dark:bg-blue-950/70"></div>
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
              className="inline-flex items-center bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 dark:bg-blue-100 dark:hover:bg-white transition-colors"
            >
              Ver Productos <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Categorías Destacadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Paletas',
              icon: <FaTable size={40} />,
              description: 'Paletas profesionales para todos los niveles',
              link: '/productos/categoria/1',
            },
            {
              title: 'Pelotas',
              icon: <FaShoppingBag size={40} />,
              description: 'Las mejores pelotas para tus entrenamientos y competiciones',
              link: '/productos/categoria/3',
            },
            {
              title: 'Mesas',
              icon: <FaShieldAlt size={40} />,
              description: 'Mesas de competición y entrenamiento',
              link: '/productos/categoria/5',
            },
          ].map((category, index) => (
            <Link
              key={index}
              href={category.link}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
            >
              <div className="text-blue-600 dark:text-blue-400 mb-4">{category.icon}</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">{category.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{category.description}</p>
              <span className="text-blue-600 dark:text-blue-400 font-medium inline-flex items-center">
                Ver productos <FaArrowRight className="ml-1" size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      {error ? (
        <div className="text-center text-red-600 dark:text-red-400">{error}</div>
      ) : (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold dark:text-white">Productos Destacados</h2>
            <Link
              href="/productos"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium inline-flex items-center"
            >
              Ver todos <FaArrowRight className="ml-1" size={14} />
            </Link>
          </div>
          <ProductGrid productos={productos} />
        </section>
      )}

      {/* Banner promocional */}
      <section className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center transition-colors duration-200">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">¿Eres nuevo en el tenis de mesa?</h2>
        <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6">
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
