'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaSearch, FaBars, FaTimes } from 'react-icons/fa';

export default function SimpleHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <header className="bg-blue-700 text-white shadow-md">
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
            <Link href="/" className="hover:text-blue-200">
              Inicio
            </Link>
            <Link href="/productos" className="hover:text-blue-200">
              Productos
            </Link>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="bg-blue-600 text-white placeholder-blue-300 rounded-full py-1 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
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
            
            <Link href="/carrito" className="relative hover:text-blue-200">
              <FaShoppingCart size={24} />
            </Link>
          </nav>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-600">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="hover:text-blue-200"
                onClick={toggleMenu}
              >
                Inicio
              </Link>
              <Link
                href="/productos"
                className="hover:text-blue-200"
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
                <span>Carrito</span>
              </Link>
              
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="bg-blue-600 text-white placeholder-blue-300 rounded-full py-1 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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