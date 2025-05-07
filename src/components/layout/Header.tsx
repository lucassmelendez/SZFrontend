'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaShoppingCart, FaSearch, FaBars, FaTimes, FaMoon, FaSun, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useCarrito } from '@/lib/useCarrito';
import { useTheme } from '@/lib/useTheme';
import { useAuth } from '../../lib/auth/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { cantidadTotal } = useCarrito();
  const { theme, toggleTheme, isClient } = useTheme();
  const { user, logout } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú de perfil cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/productos/buscar?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="bg-blue-700 dark:bg-blue-900 text-white shadow-md transition-colors duration-200">
      <div className="container mx-auto px-4">
        {/* Primera fila: Menú, Logo, Perfil y Carrito */}
        <div className="flex justify-between items-center py-4">
          {/* Sección izquierda: Menú y Logo */}
          <div className="flex items-center space-x-4">
            {/* Hamburger menu for mobile */}
            <button
              className="md:hidden text-white mr-2"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold flex items-center">
              <span>SpinZone</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 ml-4">
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
            </nav>
          </div>

          {/* Sección derecha: Perfil y Carrito */}
          <div className="flex items-center space-x-4">
            {/* Perfil - visible en todas las pantallas */}
            <div className="relative" ref={profileMenuRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 hover:text-blue-200"
                  >
                    <FaUser size={20} />
                    <span className="hidden md:inline text-sm">{user.nombre.split(' ')[0]}</span>
                  </button>
                  
                  {/* Menú desplegable de cuenta */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-xl z-50">
                      <Link
                        href="/perfil"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <FaSignOutAlt className="mr-2" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center space-x-2 hover:text-blue-200"
                >
                  <FaUser size={20} />
                  <span className="hidden md:inline text-sm">Iniciar sesión</span>
                </Link>
              )}
            </div>

            {/* Carrito - visible en todas las pantallas */}
            <Link href="/carrito" className="relative hover:text-blue-200">
              <FaShoppingCart size={24} />
              {cantidadTotal > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cantidadTotal}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Segunda fila: Barra de búsqueda (solo en móvil) */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="bg-blue-600 dark:bg-blue-800 text-white placeholder-blue-300 rounded-full py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
              aria-label="Buscar"
            >
              <FaSearch />
            </button>
          </form>
        </div>

        {/* Desktop: Barra de búsqueda y tema */}
        <div className="hidden md:flex items-center justify-between py-4">
          <div className="flex-grow max-w-md mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="bg-blue-600 dark:bg-blue-800 text-white placeholder-blue-300 rounded-full py-1 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
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
          </div>

          {/* Botón de tema - solo se muestra si estamos en el cliente */}
          {isClient && (
            <button 
              onClick={toggleTheme} 
              className="text-white hover:text-blue-200 p-1 rounded-full focus:outline-none ml-4"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
            </button>
          )}
        </div>

        {/* Mobile Navigation - Panel lateral desde la izquierda */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="bg-blue-700 dark:bg-blue-900 h-full w-4/5 max-w-sm py-4 px-6 overflow-y-auto transform transition-transform duration-300 ease-in-out">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Menú</h2>
                <button 
                  onClick={toggleMenu}
                  className="text-white"
                  aria-label="Cerrar menú"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              <nav className="flex flex-col">
                {/* Sección de navegación */}
                <div className="space-y-0">
                  <Link
                    href="/"
                    className={`block py-3 hover:text-blue-200 ${pathname === '/' ? 'font-bold' : ''}`}
                    onClick={toggleMenu}
                  >
                    Inicio
                  </Link>
                  <Link
                    href="/productos"
                    className={`block py-3 hover:text-blue-200 ${
                      pathname.startsWith('/productos') ? 'font-bold' : ''
                    }`}
                    onClick={toggleMenu}
                  >
                    Productos
                  </Link>
                </div>
                
                {/* Divisor principal */}
                <div className="my-4 border-t border-blue-600 dark:border-blue-800"></div>
                
                {/* Sección de configuración */}
                <div className="space-y-0">
                  {/* Botón de tema en móvil - solo se muestra si estamos en el cliente */}
                  {isClient && (
                    <button 
                      onClick={toggleTheme} 
                      className="flex items-center space-x-2 hover:text-blue-200 py-3 w-full"
                      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    >
                      {theme === 'dark' ? <FaSun size={18} /> : <FaMoon size={18} />}
                      <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
                    </button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}