import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Acerca de */}
          <div>
            <h3 className="text-xl font-semibold mb-4">SpinZone</h3>
            <p className="text-gray-300 dark:text-gray-400 mb-4">
              Tu tienda especializada en artículos de tenis de mesa. Ofrecemos productos de alta calidad para jugadores de todos los niveles.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white">
                <FaFacebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white">
                <FaXTwitter size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/productos" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white">
                  Productos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-300 dark:text-gray-400">
                <FaMapMarkerAlt className="mr-2" />
                <span>Av. Rorro Pirrorro, Edificio 77, Oficina 7</span>
              </li>
              <li className="flex items-center text-gray-300 dark:text-gray-400">
                <FaPhone className="mr-2" />
                <span>+56 9 4452 9183</span>
              </li>
              <li className="flex items-center text-gray-300 dark:text-gray-400">
                <FaEnvelope className="mr-2" />
                <span>contacto@spinzone.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 dark:border-gray-800 mt-8 pt-6 text-center text-gray-400 dark:text-gray-500">
          <p>&copy; {currentYear} SpinZone. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
} 