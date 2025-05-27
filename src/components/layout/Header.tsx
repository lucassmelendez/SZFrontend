'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaShoppingCart, FaSearch, FaBars, FaTimes, FaUser, FaSignOutAlt, FaChevronDown, FaCogs } from 'react-icons/fa';
import { useCarrito } from '@/lib/useCarrito';
import { useAuth } from '../../lib/auth/AuthContext';
import { useFloatingCartContext } from '@/lib/FloatingCartContext';
import FloatingCart from '../cart/FloatingCart';
import { productoApi, Producto, isEmpleado } from '@/lib/api';
import { useLoginModal } from '@/lib/auth/LoginModalContext';
import CurrencyToggle from '../CurrencyToggle';

const categorias = [
  { id: 1, nombre: 'Paletas' },
  { id: 2, nombre: 'Bolsos' },
  { id: 3, nombre: 'Pelotas' },
  { id: 4, nombre: 'Mallas' },
  { id: 5, nombre: 'Mesas' },
  { id: 6, nombre: 'Gomas' }
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { cantidadTotal } = useCarrito();
  const { user, logout } = useAuth();
  const { isCartOpen, showCartAnimation, openCart, closeCart } = useFloatingCartContext();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const searchRefDesktop = useRef<HTMLDivElement>(null);
  const searchRefMobile = useRef<HTMLDivElement>(null);
  const { openLoginModal } = useLoginModal();

  // Manejar clics fuera de los menús
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Cerrar menú de categorías al hacer clic fuera
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      
      // Cerrar resultados de búsqueda al hacer clic fuera
      const clickedOutsideSearchDesktop = searchRefDesktop.current && !searchRefDesktop.current.contains(event.target as Node);
      const clickedOutsideSearchMobile = searchRefMobile.current && !searchRefMobile.current.contains(event.target as Node);
      
      if (clickedOutsideSearchDesktop && clickedOutsideSearchMobile) {
        setIsSearchActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda en tiempo real
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const results = await productoApi.search(searchQuery);
          setSearchResults(results);
          setIsSearchActive(results.length > 0);
        } catch (error) {
          console.error('Error al buscar productos:', error);
          setSearchResults([]);
          setIsSearchActive(false);
        }
      } else {
        setSearchResults([]);
        setIsSearchActive(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Cerrar el menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
    setIsMobileCategoryOpen(false);
  }, [pathname]);

  // Navegar a la página del producto
  const navigateToProduct = (productId: number) => {
    // Limpiar búsqueda
    setSearchQuery('');
    setIsSearchActive(false);
    setIsMenuOpen(false);
    
    // Navegar a la página del producto
    router.push(`/productos/${productId}`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchActive(false);
      router.push(`/productos/buscar?q=${encodeURIComponent(searchQuery)}`);
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

  // Componente para mostrar un resultado de búsqueda
  const SearchResultItem = ({ producto }: { producto: Producto }) => (
    <div 
      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 cursor-pointer"
      onClick={() => navigateToProduct(producto.id_producto)}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded overflow-hidden">
          <img
            src={`/productos/${producto.id_producto}.webp`}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
            }}
          />
        </div>
        <div className="ml-4 flex-grow">
          <p className="font-medium text-base line-clamp-1">{producto.nombre}</p>
          <p className="text-sm text-gray-500">${Math.round(producto.precio)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="bg-blue-700 text-white shadow-md transition-colors duration-200">
        <div className="container mx-auto px-4">
          {/* Primera fila (web): Logo, Navegación, Búsqueda, Perfil y Carrito */}
          <div className="hidden md:flex items-center justify-between py-4">
            {/* Sección izquierda: Logo y navegación principal */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/" className="text-2xl font-bold flex items-center">
                <span>SpinZone</span>
              </Link>

              {/* Desktop Navigation - Solo incluye Inicio, Productos y Categorías */}
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
                    <div className="absolute left-0 mt-2 w-48 py-2 bg-white rounded-md shadow-xl z-50">
                      {categorias.map((categoria) => (
                        <Link
                          key={categoria.id}
                          href={`/productos/categoria/${categoria.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

            {/* Sección central: Búsqueda con administrar a la derecha */}
            <div className="flex items-center flex-grow max-w-lg" ref={searchRefDesktop}>
              <div className="relative flex-grow mx-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    className="bg-blue-600 text-white placeholder-blue-300 rounded-full py-1 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
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
                  
                  {/* Resultados de búsqueda en desktop */}
                  {isSearchActive && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-md shadow-xl z-50 max-h-[400px] overflow-y-auto w-full">
                      {searchResults.map(producto => (
                        <SearchResultItem key={producto.id_producto} producto={producto} />
                      ))}
                    </div>
                  )}
                </form>
              </div>
              
              {/* Opción de Administrar - Ahora a la derecha de la barra de búsqueda */}
              {user && isEmpleado(user) && (
                <Link
                  href={
                    user.rol_id === 2 ? '/admin/dashboard' :
                    user.rol_id === 3 ? '/empleado/dashboard' :
                    user.rol_id === 4 ? '/bodega/dashboard' :
                    user.rol_id === 5 ? '/contabilidad/dashboard' : '/'
                  }
                  className={`whitespace-nowrap hover:text-blue-200 ${
                    pathname.includes('/admin') || pathname.includes('/empleado') || 
                    pathname.includes('/bodega') || pathname.includes('/contabilidad') ? 'font-bold' : ''
                  }`}
                >
                  Administrar
                </Link>
              )}
            </div>

            {/* Sección derecha: Perfil y Carrito */}
            <div className="flex items-center space-x-6">
              {/* Selector de moneda */}
              <CurrencyToggle />
              
              {/* Botón de inicio de sesión o menú de perfil */}
              {!user ? (
                <button
                  onClick={openLoginModal}
                  className="flex items-center space-x-2 hover:text-blue-200"
                >
                  <FaUser size={20} />
                  <span className="text-sm">Iniciar sesión</span>
                </button>
              ) : (
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
              )}

              {/* Carrito - botón que abre el carrito flotante (solo para clientes) */}
              {(!user || !isEmpleado(user)) && (
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
              )}
            </div>
          </div>

          {/* Primera fila (móvil): Menú, Logo, Perfil y Carrito */}
          <div className="flex md:hidden justify-between items-center py-4">
            {/* Sección izquierda: Menú hamburguesa */}
            <div className="flex items-center">
              <button
                className="text-white"
                onClick={toggleMenu}
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>
            
            {/* Logo o botón de Administrar (centrado entre elementos) */}
            <div className="flex-1 flex justify-center">
              {user && isEmpleado(user) ? (
                <Link
                  href={
                    user.rol_id === 2 ? '/admin/dashboard' :
                    user.rol_id === 3 ? '/empleado/dashboard' :
                    user.rol_id === 4 ? '/bodega/dashboard' :
                    user.rol_id === 5 ? '/contabilidad/dashboard' : '/'
                  }
                  className="text-xl font-bold"
                >
                  Administrar
                </Link>
              ) : (
                <Link href="/" className="text-2xl font-bold">
                  SpinZone
                </Link>
              )}
            </div>

            {/* Sección derecha: Perfil y Carrito */}
            <div className="flex items-center space-x-4">
              {/* Botones de Perfil y Cerrar Sesión */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/perfil"
                    className="flex items-center space-x-1 hover:text-blue-200"
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
                <button
                  onClick={openLoginModal}
                  className="flex items-center space-x-2 hover:text-blue-200"
                >
                  <FaUser size={20} />
                  <span className="text-sm">Iniciar sesión</span>
                </button>
              )}

              {/* Carrito - botón que abre el carrito flotante (solo para clientes) */}
              {(!user || !isEmpleado(user)) && (
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
              )}
            </div>
          </div>

          {/* Barra de búsqueda móvil */}
          <div className="md:hidden pb-4" ref={searchRefMobile}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="bg-blue-600 text-white placeholder-blue-300 rounded-full py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              {isSearchActive && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-md shadow-xl z-50 max-h-[70vh] overflow-y-auto w-full">
                  {searchResults.map(producto => (
                    <SearchResultItem key={producto.id_producto} producto={producto} />
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Mobile Navigation - Panel lateral desde la izquierda */}
          {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 backdrop-blur-sm bg-transparent">
              <div className="bg-blue-700 h-full w-4/5 max-w-sm py-4 px-6 overflow-y-auto transform transition-transform duration-300 ease-in-out">
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
                    
                    {/* Categorías como desplegable */}
                    <div className="py-3">
                      <button 
                        onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                        className={`flex items-center justify-between w-full hover:text-blue-200 ${
                          pathname.includes('/productos/categoria') ? 'font-bold' : ''
                        }`}
                      >
                        <span>Categorías</span>
                        <FaChevronDown className={`transition-transform ${isMobileCategoryOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isMobileCategoryOpen && (
                        <div className="pl-4 pt-2 space-y-2">
                          {categorias.map((categoria) => (
                            <Link
                              key={categoria.id}
                              href={`/productos/categoria/${categoria.id}`}
                              className="block py-2 text-sm hover:text-blue-200"
                              onClick={() => {
                                setIsMobileCategoryOpen(false);
                                setIsMenuOpen(false);
                              }}
                            >
                              {categoria.nombre}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </nav>

                {/* Menú móvil - Login/Register */}
                {!user && (
                  <div className="border-t border-blue-800 pt-4 mt-4">
                    {/* Se eliminó el botón de iniciar sesión */}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Carrito flotante - solo para clientes */}
      {(!user || !isEmpleado(user)) && (
        <FloatingCart isOpen={isCartOpen} onClose={closeCart} />
      )}
    </>
  );
}