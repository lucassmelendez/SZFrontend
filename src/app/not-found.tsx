import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/lib/useTheme';
import { AuthProvider } from '@/lib/auth/AuthContext';

export default function NotFound() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 text-center">
              <h1 className="text-6xl font-bold text-blue-700 dark:text-blue-500 mb-6">404</h1>
              <h2 className="text-3xl font-semibold mb-4">Página no encontrada</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
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
          <Footer />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
} 