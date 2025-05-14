'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaShoppingCart, FaSearch, FaBars, FaTimes, FaMoon, FaSun, FaUser, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { useCarrito } from '@/lib/useCarrito';
import { useTheme } from '@/lib/useTheme';
import { useAuth } from '../../lib/auth/AuthContext';
import { useFloatingCartContext } from '@/lib/FloatingCartContext';
import FloatingCart from '../cart/FloatingCart';
import { productoApi, Producto } from '@/lib/api';
import { useLoginModal } from '@/lib/auth/LoginModalContext';

const categorias = [
  { id: 1, nombre: 'Paletas' },
  { id: 2, nombre: 'Bolsos' },
  { id: 3, nombre: 'Pelotas' },
  { id: 4, nombre: 'Mallas' },
  { id: 5, nombre: 'Mesas' }
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const pathname = usePathname();
  const { cantidadTotal } = useCarrito();
  const { theme, toggleTheme, isClient } = useTheme();
  const { user, logout } = useAuth();
  const { isCartOpen, showCartAnimation, openCart, closeCart } = useFloatingCartContext();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { openLoginModal } = useLoginModal();

  // Cerrar los menús cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto para manejar la búsqueda en tiempo real
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const results = await productoApi.search(searchQuery);
          setSearchResults(results);
          setIsSearchOpen(true);
        } catch (error) {
          console.error('Error al buscar productos:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/productos/buscar?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Función para abrir el modal de registro
  const handleOpenRegister = () => {
    // Este es un hack para asegurarnos que el componente LoginModal
    // tenga tiempo de renderizar y cambiar a la vista de registro
    openLoginModal();
    setTimeout(() => {
      const registerBtn = document.querySelector('[data-testid="register-link"]');
      if (registerBtn) {
        (registerBtn as HTMLButtonElement).click();
      }
    }, 100);
  };

  return (
    <>
      <header className="bg-blue-700 dark:bg-blue-900 text-white shadow-md transition-colors duration-200">
        <div className="container mx-auto px-4">
          {/* Primera fila (web): Logo, Navegación, Búsqueda, Tema, Perfil y Carrito */}
          <div className="hidden md:flex items-center justify-between py-4">
            {/* Sección izquierda: Logo y navegación */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/" className="text-2xl font-bold flex items-center">
                <span>SpinZone</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="flex items-center space-x-8">
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
                {/* Menú desplegable de Categorías */}
                <div className="relative" ref={categoryMenuRef}>
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className={`flex items-center space-x-1 hover:text-blue-200 ${isCategoryOpen ? 'text-blue-200' : ''}`}
                  >
                    <span>Categorías</span>
                    <FaChevronDown className={`transform transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Menú desplegable */}
                  {isCategoryOpen && (
                    <div className="absolute left-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-xl z-50">
                      {categorias.map((categoria) => (
                        <Link
                          key={categoria.id}
                          href={`/productos/categoria/${categoria.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsCategoryOpen(false)}
                        >
                          {categoria.nombre}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Sección central: Búsqueda */}
            <div className="flex-grow max-w-md mx-auto px-4" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="bg-blue-600 dark:bg-blue-800 text-white placeholder-blue-300 rounded-full py-1 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                  value={searchQuery}
                  onChange={handleSearchInput}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                  aria-label="Buscar"
                >
                  <FaSearch />
                </button>

                {/* Resultados de búsqueda */}
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-xl z-50 max-h-96 overflow-y-auto">
                    {searchResults.map((producto) => (
                      <Link
                        key={producto.id_producto}
                        href={`/productos/${producto.id_producto}`}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                            <img
                              src={`https://picsum.photos/seed/${producto.id_producto}/100/100`}
                              alt={producto.nombre}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{producto.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">${Math.round(producto.precio)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* Sección derecha: Tema, Perfil y Carrito */}
            <div className="flex items-center space-x-6">
              {/* Botón de tema - solo se muestra si estamos en el cliente */}
              {isClient && (
                <button 
                  onClick={toggleTheme} 
                  className="text-white hover:text-blue-200 p-1 rounded-full focus:outline-none"
                  aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
                </button>
              )}
              
              {/* Botones de Perfil y Cerrar Sesión */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/perfil"
                    className="flex items-center space-x-2 hover:text-blue-200"
                  >
                    <FaUser size={20} />
                    <span className="text-sm">{user.nombre.split(' ')[0]}</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="hover:text-red-400"
                    aria-label="Cerrar sesión"
                  >
                    <FaSignOutAlt size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={openLoginModal}
                    className="flex items-center space-x-2 hover:text-blue-200"
                  >
                    <FaUser size={20} />
                    <span className="text-sm">Iniciar sesión</span>
                  </button>
                  <button
                    onClick={handleOpenRegister}
                    className="flex items-center py-1.5 px-3 rounded-full border border-blue-300 hover:bg-blue-600 transition-colors"
                  >
                    <span className="text-sm">Registrarse</span>
                  </button>
                </div>
              )}

              {/* Carrito - botón que abre el carrito flotante */}
              <button 
                onClick={openCart} 
                className={`relative hover:text-blue-200 ${showCartAnimation ? 'animate-pulse' : ''}`}
              >
                <FaShoppingCart size={24} />
                {cantidadTotal > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cantidadTotal}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Primera fila (móvil): Menú, Logo, Perfil y Carrito */}
          <div className="flex md:hidden justify-between items-center py-4">
            {/* Sección izquierda: Menú y Logo */}
            <div className="flex items-center space-x-4">
              {/* Hamburger menu for mobile */}
              <button
                className="text-white mr-2"
                onClick={toggleMenu}
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            
              {/* Logo */}
              <Link href="/" className="text-2xl font-bold flex items-center">
                <span>SpinZone</span>
              </Link>
            </div>

            {/* Sección derecha: Perfil y Carrito */}
            <div className="flex items-center space-x-4">
              {/* Botones de Perfil y Cerrar Sesión */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/perfil"
                    className="hover:text-blue-200"
                  >
                    <FaUser size={20} />
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="hover:text-red-400"
                    aria-label="Cerrar sesión"
                  >
                    <FaSignOutAlt size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={openLoginModal}
                    className="flex items-center space-x-2 hover:text-blue-200"
                  >
                    <FaUser size={20} />
                    <span className="text-sm">Iniciar sesión</span>
                  </button>
                  <button
                    onClick={handleOpenRegister}
                    className="flex items-center py-1.5 px-3 rounded-full border border-blue-300 hover:bg-blue-600 transition-colors"
                  >
                    <span className="text-sm">Registrarse</span>
                  </button>
                </div>
              )}

              {/* Carrito - botón que abre el carrito flotante */}
              <button 
                onClick={openCart} 
                className={`relative hover:text-blue-200 ${showCartAnimation ? 'animate-pulse' : ''}`}
              >
                <FaShoppingCart size={24} />
                {cantidadTotal > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cantidadTotal}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Segunda fila: Barra de búsqueda (solo en móvil) */}
          <div className="md:hidden pb-4" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="bg-blue-600 dark:bg-blue-800 text-white placeholder-blue-300 rounded-full py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={searchQuery}
                onChange={handleSearchInput}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                aria-label="Buscar"
              >
                <FaSearch />
              </button>

              {/* Resultados de búsqueda en móvil */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-xl z-50 max-h-[60vh] overflow-y-auto">
                  {searchResults.map((producto) => (
                    <Link
                      key={producto.id_producto}
                      href={`/productos/${producto.id_producto}`}
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        setIsMenuOpen(false); // Cerrar el menú móvil si está abierto
                      }}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          <img
                            src={`https://picsum.photos/seed/${producto.id_producto}/100/100`}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-3 flex-grow">
                          <p className="font-medium line-clamp-1">{producto.nombre}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">${Math.round(producto.precio)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Mobile Navigation - Panel lateral desde la izquierda */}
          {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 backdrop-blur-sm bg-transparent">
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
                      className={`block py-3 hover:text-blue-200 ${pathname.startsWith('/productos') ? 'font-bold' : ''}`}
                      onClick={toggleMenu}
                    >
                      Productos
                    </Link>
                    {/* Categorías en móvil */}
                    <div className="py-3">
                      <span className="block text-white mb-2">Categorías</span>
                      <div className="pl-4 space-y-2">
                        {categorias.map((categoria) => (
                          <Link
                            key={categoria.id}
                            href={`/productos/categoria/${categoria.id}`}
                            className="block py-2 text-sm hover:text-blue-200"
                            onClick={toggleMenu}
                          >
                            {categoria.nombre}
                          </Link>
                        ))}
                      </div>
                    </div>
                    
                    {/* Enlace a perfil en móvil (dentro del menú) */}
                    {user && (
                      <Link
                        href="/perfil"
                        className={`block py-3 hover:text-blue-200 ${pathname === '/perfil' ? 'font-bold' : ''}`}
                        onClick={toggleMenu}
                      >
                        Mi Perfil
                      </Link>
                    )}
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

                {/* Menú móvil - Login/Register */}
                {!user && (
                  <div className="border-t border-blue-800 dark:border-blue-700 pt-4 mt-4">
                    <button
                      onClick={() => {
                        openLoginModal();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-blue-800 dark:hover:bg-blue-800"
                    >
                      <FaUser className="mr-2" />
                      Iniciar sesión
                    </button>
                    <button
                      onClick={() => {
                        handleOpenRegister();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-blue-800 dark:hover:bg-blue-800"
                    >
                      <FaUser className="mr-2" />
                      Registrarse
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Carrito flotante */}
      <FloatingCart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}