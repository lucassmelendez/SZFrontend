'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado, productoApi, Producto } from '@/lib/api';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiArrowLeft, FiPlus, FiAlertTriangle } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const categoriasMap: { [key: string]: string } = {
  '1': 'Paletas',
  '2': 'Bolsos',
  '3': 'Pelotas',
  '4': 'Mallas',
  '5': 'Mesas'
};

export default function AdminInventario() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  // Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const productosPorPagina = 10;
  
  // Estado para el modal de agregar producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    marca: '',
    categoria_id: '1',
    precio: '',
    peso: '',
    stock: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Estado para el modal de editar producto
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [datosEditados, setDatosEditados] = useState({
    nombre: '',
    descripcion: '',
    marca: '',
    categoria_id: '',
    precio: '',
    peso: '',
    stock: ''
  });
  
  // Estado para el modal de confirmación de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar productos
  useEffect(() => {
    if (!authLoading && (!user || !isEmpleado(user) || user.rol_id !== 2)) {
      router.push('/');
      return;
    }
    
    cargarProductos();
  }, [user, authLoading, router, pagina, searchTerm, categoriaSeleccionada]);

  const cargarProductos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let productosData: Producto[] = [];        if (searchTerm || categoriaSeleccionada) {
        const response = await fetch('https://sz-backend.vercel.app/api/productos');
        const data = await response.json();
        let allProducts = data.data;
        if (!allProducts || !Array.isArray(allProducts)) {
          throw new Error('Formato de datos no válido');
        }
        
        // Filtrar productos según los criterios
        productosData = allProducts.filter(producto => {
          const matchesSearch = !searchTerm || 
            producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesCategoria = !categoriaSeleccionada || 
            producto.categoria_id === parseInt(categoriaSeleccionada);
          
          return matchesSearch && matchesCategoria;
        });
      } else {
        console.log('Obteniendo todos los productos...');
        try {
          const response = await fetch('https://sz-backend.vercel.app/api/productos');
          const data = await response.json();
          console.log('Respuesta completa de la API:', data);
          
          if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Formato de datos no válido');
          }
          
          productosData = data.data;
          console.log('Productos procesados:', productosData);
          if (!productosData.length) {
            console.warn('No se encontraron productos');
          }
        } catch (error: any) {
          console.error('Error detallado:', error);
          throw new Error('Error al obtener productos: ' + (error.message || 'Error desconocido'));
        }
      }

      if (!productosData || !Array.isArray(productosData)) {
        console.error('Datos inválidos:', productosData);
        throw new Error('No se recibieron datos válidos de la API');
      }

      const total = productosData.length;
      console.log('Total de productos:', total);
      
      const inicio = (pagina - 1) * productosPorPagina;
      const fin = inicio + productosPorPagina;
      const productosPaginados = productosData.slice(inicio, fin);
      console.log('Productos paginados:', productosPaginados);

      setProductos(productosPaginados);
      setTotalProductos(total);
    } catch (error: any) {
      console.error('Error al cargar productos:', error);
      setError(error.message || 'No se pudieron cargar los productos. Por favor, intenta nuevamente más tarde.');
      setProductos([]);
      setTotalProductos(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejadores de eventos
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPagina(1);
  };

  const handleCategoriaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoriaSeleccionada(event.target.value);
    setPagina(1);
  };

  // Función para editar un producto
  const handleEditarProducto = (id: number) => {
    const producto = productos.find(p => p.id_producto === id);
    if (!producto) return;
    
    setProductoEditando(producto);
    setDatosEditados({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      marca: producto.marca,
      categoria_id: producto.categoria_id.toString(),
      precio: producto.precio.toString(),
      peso: producto.peso.toString(),
      stock: producto.stock.toString()
    });
    setIsEditModalOpen(true);
    setModalError(null);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setProductoEditando(null);
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDatosEditados(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoEditando) return;
    
    setModalError(null);
    
    // Validación básica
    if (!datosEditados.nombre || !datosEditados.marca || !datosEditados.precio || !datosEditados.stock) {
      setModalError('Por favor, completa todos los campos obligatorios.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Convertir los campos numéricos
      const productoData = {
        id_producto: productoEditando.id_producto,
        nombre: datosEditados.nombre,
        descripcion: datosEditados.descripcion,
        marca: datosEditados.marca,
        categoria_id: parseInt(datosEditados.categoria_id),
        precio: parseFloat(datosEditados.precio),
        peso: parseFloat(datosEditados.peso) || 0,
        stock: parseInt(datosEditados.stock)
      };
      
      // Enviar datos a la API
      const response = await fetch(`https://sz-backend.vercel.app/api/productos/${productoEditando.id_producto}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productoData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el producto');
      }
      
      // Actualizar la lista de productos
      await cargarProductos();
      
      // Cerrar el modal y mostrar mensaje de éxito
      handleCloseEditModal();
      toast.success('Producto actualizado correctamente');
    } catch (error: any) {
      console.error('Error al actualizar producto:', error);
      setModalError(error.message || 'Error al actualizar el producto. Por favor, intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Funciones para eliminar un producto
  const handleEliminarProducto = (id: number) => {
    const producto = productos.find(p => p.id_producto === id);
    if (!producto) return;
    
    setProductoAEliminar(producto);
    setIsDeleteModalOpen(true);
  };
  
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductoAEliminar(null);
  };
  
  const handleConfirmDelete = async () => {
    if (!productoAEliminar) return;
    
    try {
      setIsDeleting(true);
      
      // Enviar solicitud de eliminación a la API
      const response = await fetch(`https://sz-backend.vercel.app/api/productos/${productoAEliminar.id_producto}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el producto');
      }
      
      // Actualizar la lista de productos
      await cargarProductos();
      
      // Cerrar el modal y mostrar mensaje de éxito
      handleCloseDeleteModal();
      toast.success('Producto eliminado correctamente');
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      toast.error(error.message || 'Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  };

  // Manejadores para el modal de agregar producto
  const openModal = () => {
    setIsModalOpen(true);
    setModalError(null);
    setNuevoProducto({
      nombre: '',
      descripcion: '',
      marca: '',
      categoria_id: '1',
      precio: '',
      peso: '',
      stock: ''
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoProducto({
      ...nuevoProducto,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Validación básica
    if (!nuevoProducto.nombre || !nuevoProducto.marca || !nuevoProducto.precio || !nuevoProducto.stock) {
      setModalError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    try {
      setIsSaving(true);
      
      // Convertir los campos numéricos
      const productoData = {
        ...nuevoProducto,
        precio: parseFloat(nuevoProducto.precio),
        peso: parseFloat(nuevoProducto.peso) || 0,
        stock: parseInt(nuevoProducto.stock),
        categoria_id: parseInt(nuevoProducto.categoria_id)
      };
      
      // Enviar datos a la API
      const response = await fetch('https://sz-backend.vercel.app/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productoData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el producto');
      }
      
      // Actualizar la lista de productos
      await cargarProductos();
      
      // Cerrar el modal y mostrar mensaje de éxito
      closeModal();
      toast.success('Producto creado correctamente');
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      setModalError(error.message || 'Error al guardar el producto. Por favor, intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <div className="flex gap-3">
          <button 
            onClick={openModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Agregar Producto
          </button>
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <FiArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative flex-1">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select 
                value={categoriaSeleccionada}
                onChange={handleCategoriaChange}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {Object.entries(categoriasMap).map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla para pantallas medianas y grandes */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productos.map((producto) => (
                  <tr key={producto.id_producto} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">#{producto.id_producto}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-xs text-gray-500 md:hidden">{producto.descripcion}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">{producto.descripcion}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{producto.marca}</td>
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-sm">{categoriasMap[producto.categoria_id]}</td>
                    <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm">{producto.peso} kg</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        producto.stock > 10 
                          ? 'bg-green-100 text-green-800'
                          : producto.stock > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {producto.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      ${producto.precio.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditarProducto(producto.id_producto)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEliminarProducto(producto.id_producto)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas para dispositivos móviles */}
          <div className="md:hidden space-y-4">
            {productos.map((producto) => (
              <div key={producto.id_producto} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-lg font-bold text-blue-600">#{producto.id_producto}</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditarProducto(producto.id_producto)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEliminarProducto(producto.id_producto)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="font-medium text-lg mb-2">{producto.nombre}</div>
                <p className="text-sm text-gray-600 mb-3">{producto.descripcion}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Marca:</span>
                    <span className="font-medium ml-2">{producto.marca}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Categoría:</span>
                    <span className="font-medium ml-2">{categoriasMap[producto.categoria_id]}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Peso:</span>
                    <span className="font-medium ml-2">{producto.peso} kg</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Stock:</span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      producto.stock > 10 
                        ? 'bg-green-100 text-green-800'
                        : producto.stock > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {producto.stock}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                  <span className="text-gray-500">Precio:</span>
                  <span className="font-bold text-lg">${producto.precio.toLocaleString('es-CL')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Mostrando {((pagina - 1) * productosPorPagina) + 1} a {Math.min(pagina * productosPorPagina, totalProductos)} de {totalProductos} productos
            </div>
            <div className="flex gap-2 justify-center sm:justify-end">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina(p => p + 1)}
                disabled={pagina * productosPorPagina >= totalProductos}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Agregar Producto */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Agregar Nuevo Producto" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md">
              {modalError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="nombre"
                value={nuevoProducto.nombre}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                name="marca"
                value={nuevoProducto.marca}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={nuevoProducto.descripcion}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="categoria_id"
                value={nuevoProducto.categoria_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(categoriasMap).map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (CLP) *
              </label>
              <input
                type="number"
                name="precio"
                value={nuevoProducto.precio}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                name="peso"
                value={nuevoProducto.peso}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={nuevoProducto.stock}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Guardando...
                </>
              ) : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal de Editar Producto */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Editar Producto" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {modalError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md">
              {modalError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="nombre"
                value={datosEditados.nombre}
                onChange={handleEditInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                name="marca"
                value={datosEditados.marca}
                onChange={handleEditInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={datosEditados.descripcion}
                onChange={handleEditInputChange}
                rows={3}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="categoria_id"
                value={datosEditados.categoria_id}
                onChange={handleEditInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(categoriasMap).map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (CLP) *
              </label>
              <input
                type="number"
                name="precio"
                value={datosEditados.precio}
                onChange={handleEditInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                name="peso"
                value={datosEditados.peso}
                onChange={handleEditInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={datosEditados.stock}
                onChange={handleEditInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={handleCloseEditModal}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Actualizando...
                </>
              ) : 'Actualizar Producto'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal de Confirmación de Eliminación */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Confirmar Eliminación" size="sm">
        <div className="p-4">
          <div className="flex items-center text-amber-600 mb-4">
            <FiAlertTriangle className="w-8 h-8 mr-3" />
            <h3 className="text-lg font-medium">¿Estás seguro?</h3>
          </div>
          
          <p className="mb-4 text-gray-600">
            ¿Realmente deseas eliminar el producto <span className="font-medium">{productoAEliminar?.nombre}</span>?
            Esta acción no se puede deshacer.
          </p>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={handleCloseDeleteModal}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Eliminando...
                </>
              ) : 'Eliminar Producto'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
