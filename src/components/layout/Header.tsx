'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaShoppingCart, FaSearch, FaBars, FaTimes, FaMoon, FaSun } from 'react-icons/fa';
import { useCarrito } from '@/lib/useCarrito';
import { useTheme } from '@/lib/useTheme';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { cantidadTotal } = useCarrito();
  const { theme, toggleTheme } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/productos/buscar?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-blue-700 dark:bg-blue-900 text-white shadow-md transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold flex items-center">
            <span>SpinZone</span>
          </Link>

          {/* Hamburger menu for mobile */}
          <button
            className="md:hidden text-white"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`hover:text-blue-200 ${pathname === '/' ? 'font-bold' : ''}`}
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              className={`hover:text-blue-200 ${pathname.startsWith('/productos') ? 'font-bold' : ''}`}
            >
              Productos
            </Link>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="bg-blue-600 dark:bg-blue-800 text-white placeholder-blue-300 rounded-full py-1 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                aria-label="Buscar"
              >
                <FaSearch />
              </button>
            </form>
            
            {/* Botón de tema */}
            <button 
              onClick={toggleTheme} 
              className="text-white hover:text-blue-200 p-1 rounded-full focus:outline-none"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
            </button>
            
            <Link href="/carrito" className="relative hover:text-blue-200">
              <FaShoppingCart size={24} />
              {cantidadTotal > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cantidadTotal}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-600 dark:border-blue-800">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className={`hover:text-blue-200 ${pathname === '/' ? 'font-bold' : ''}`}
                onClick={toggleMenu}
              >
                Inicio
              </Link>
              <Link
                href="/productos"
                className={`hover:text-blue-200 ${
                  pathname.startsWith('/productos') ? 'font-bold' : ''
                }`}
                onClick={toggleMenu}
              >
                Productos
              </Link>
              <Link
                href="/carrito"
                className="flex items-center space-x-2 hover:text-blue-200"
                onClick={toggleMenu}
              >
                <FaShoppingCart />
                <span>Carrito ({cantidadTotal})</span>
              </Link>
              
              {/* Botón de tema en móvil */}
              <button 
                onClick={toggleTheme} 
                className="flex items-center space-x-2 hover:text-blue-200"
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark' ? <FaSun size={18} /> : <FaMoon size={18} />}
                <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
              </button>
              
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="bg-blue-600 dark:bg-blue-800 text-white placeholder-blue-300 rounded-full py-1 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                  aria-label="Buscar"
                >
                  <FaSearch />
                </button>
              </form>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 