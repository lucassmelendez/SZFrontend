'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Producto } from '@/lib/api';
import ProductCard from './ProductCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ProductCarouselProps {
  productos: Producto[];
  title?: string;
}

export default function ProductCarousel({ productos, title }: ProductCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(4);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Actualizar el número de slides por vista basado en el ancho de la ventana
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setSlidesPerView(1);
        setIsMobile(true);
      } else if (width < 768) {
        setSlidesPerView(2);
        setIsMobile(false);
      } else if (width < 1024) {
        setSlidesPerView(3);
        setIsMobile(false);
      } else if (width < 1280) {
        setSlidesPerView(4);
        setIsMobile(false);
      } else {
        setSlidesPerView(5);
        setIsMobile(false);
      }
    };

    // Configuración inicial
    handleResize();

    // Añadir listener para cambios de tamaño
    window.addEventListener('resize', handleResize);

    // Limpieza
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Total de slides disponibles
  const totalSlides = productos.length;
  
  // Número máximo de páginas
  const maxPages = Math.ceil(totalSlides / slidesPerView);

  // Ir a la siguiente diapositiva
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + slidesPerView;
      return nextIndex >= totalSlides ? 0 : nextIndex;
    });
  };

  // Ir a la diapositiva anterior
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex - slidesPerView;
      return nextIndex < 0 ? Math.max(0, totalSlides - slidesPerView) : nextIndex;
    });
  };

  // Ir a una página específica
  const goToPage = (pageIndex: number) => {
    setCurrentIndex(pageIndex * slidesPerView);
  };

  // Productos visibles actualmente
  const visibleProductos = productos.slice(currentIndex, currentIndex + slidesPerView);

  if (productos.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{title || 'Productos'}</h2>
        <p className="text-gray-600 dark:text-gray-400">No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="flex justify-center items-center mb-6">
        {title && <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center">{title}</h2>}
      </div>
      
      <div className="relative">
        {/* Botón izquierdo */}
        <button 
          onClick={prevSlide}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full shadow-md transition-colors"
          aria-label="Anterior"
        >
          <FaChevronLeft className="text-blue-600 dark:text-blue-400" />
        </button>
        
        <div className="relative overflow-hidden px-1" ref={containerRef}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 max-w-full mx-auto">
            {visibleProductos.map((producto) => (
              <div key={producto.id_producto} className="h-full transform scale-110 p-2">
                <ProductCard producto={producto} />
              </div>
            ))}
          </div>
          
          {/* Paginación */}
          <div className="flex justify-center mt-10 space-x-3 pb-4">
            {Array.from({ length: maxPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={`w-3 h-3 rounded-full ${
                  Math.floor(currentIndex / slidesPerView) === index
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={`Ir a la página ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Botón derecho */}
        <button 
          onClick={nextSlide}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full shadow-md transition-colors"
          aria-label="Siguiente"
        >
          <FaChevronRight className="text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    </div>
  );
} 