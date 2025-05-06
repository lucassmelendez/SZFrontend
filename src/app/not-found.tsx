import Link from 'next/link';
import SimpleHeader from '@/components/layout/SimpleHeader';
import SimpleFooter from '@/components/layout/SimpleFooter';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <SimpleHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 text-center">
          <h1 className="text-6xl font-bold text-blue-700 mb-6">404</h1>
          <h2 className="text-3xl font-semibold mb-4">Página no encontrada</h2>
          <p className="text-gray-600 max-w-md mb-8">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          <Link 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
      <SimpleFooter />
    </div>
  );
} 