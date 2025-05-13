'use client';

import { useState, useRef, useEffect } from 'react';
import { Producto } from '@/lib/api';
import ProductCard from './ProductCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ProductCarouselProps {
  productos: Producto[];
  title: string;
}

export default function ProductCarousel({ productos, title }: ProductCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Actualizar items por página basado en el ancho de la pantalla
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 768) {
        setItemsPerPage(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(3);
      } else if (window.innerWidth < 1280) {
        setItemsPerPage(4);
      } else {
        setItemsPerPage(5);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Actualizar número total de páginas cuando cambia itemsPerPage
  useEffect(() => {
    setTotalPages(Math.ceil(productos.length / itemsPerPage));
    // Asegurarse de que la página actual sea válida
    if (currentPage >= Math.ceil(productos.length / itemsPerPage)) {
      setCurrentPage(Math.max(0, Math.ceil(productos.length / itemsPerPage) - 1));
    }
  }, [productos, itemsPerPage, currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (productos.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400">No se encontraron productos.</p>
      </div>
    );
  }

  const displayedProducts = productos.slice(
    currentPage * itemsPerPage,
    Math.min((currentPage + 1) * itemsPerPage, productos.length)
  );

  return (
    <div className="my-8">
      {title && <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">{title}</h2>}

      <div className="relative">
        {/* Botón anterior */}
        <button 
          onClick={prevPage} 
          disabled={currentPage === 0}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-md p-3 text-blue-600 dark:text-blue-400 ${
            currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label="Anterior"
        >
          <FaChevronLeft size={20} />
        </button>

        {/* Carrusel */}
        <div 
          ref={carouselRef} 
          className="overflow-hidden mx-12"
        >
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {productos.map((producto) => (
              <div 
                key={producto.id_producto} 
                className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 px-3"
              >
                <ProductCard producto={producto} />
              </div>
            ))}
          </div>
        </div>

        {/* Botón siguiente */}
        <button 
          onClick={nextPage} 
          disabled={currentPage >= totalPages - 1}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-md p-3 text-blue-600 dark:text-blue-400 ${
            currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label="Siguiente"
        >
          <FaChevronRight size={20} />
        </button>
      </div>

      {/* Indicadores de página */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`w-3 h-3 rounded-full ${
              currentPage === index 
                ? 'bg-blue-600 dark:bg-blue-400' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Página ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 