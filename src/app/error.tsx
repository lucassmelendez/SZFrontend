'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar el error en un servicio de análisis o log
    console.error('Error en la aplicación:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <h1 className="text-3xl font-bold mb-6">Algo salió mal</h1>
      <p className="mb-8 max-w-md">
        Ha ocurrido un error al cargar esta página. Por favor, intenta recargar o vuelve al inicio.
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-full font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
} 