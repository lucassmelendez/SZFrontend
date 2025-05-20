'use client';

import { useState, useEffect } from 'react';
import { empleadoApiFast, apiFast } from '@/lib/api';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';

// Interfaces mejoradas para manejar los tipos de datos
interface EmpleadoBase {
  nombre: string;
  apellido: string;
  rut?: string;
  correo: string;
  direccion: string;
  telefono: string | number;
  rol_id: number;
}

// Interfaz para los datos que se envían en la actualización
interface EmpleadoUpdate {
  nombre?: string;
  apellido?: string;
  rut?: string;
  correo?: string;
  direccion?: string;
  telefono?: string | number;
  rol_id?: number;
}

interface Empleado {
  id_empleado: number;
  nombre: string;
  apellido: string;
  correo: string;
  direccion: string;
  telefono: string | number;
  rol_id: number;
  rut?: string;
  contrasena?: string;
  informe_id?: number;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

const roles: Record<number, string> = {
  2: "Administrador",
  3: "Vendedor",
  4: "Bodeguero",
  5: "Contador"
};

export default function EmpleadosPage() {
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Iniciando petición a la API...');
        const response = await apiFast.get('/empleados');
        console.log('Respuesta completa de la API:', response);
        
        let empleadosData;
        if (response.data.empleados) {
          empleadosData = response.data.empleados;
        } else if (Array.isArray(response.data)) {
          empleadosData = response.data;
        } else {
          console.error('Estructura de datos inesperada:', response.data);
          throw new Error('Formato de datos no válido');
        }
        
        console.log('Empleados procesados:', empleadosData);
        if (!empleadosData.length) {
          console.warn('No se encontraron empleados');
        }
        
        setEmpleados(empleadosData);
      } catch (err) {
        console.error('Error al cargar los empleados:', err);
        setError('Error al cargar los empleados. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmpleados();
  }, []);

  const handleEdit = async (id: number) => {
    try {
      const empleadoToEdit = empleados.find(emp => emp.id_empleado === id);
      if (empleadoToEdit) {
        setSelectedEmpleado(empleadoToEdit);
        setIsEditModalOpen(true);
      }
    } catch (err) {
      setError('Error al editar el empleado');
      console.error('Error:', err);
    }
  };
  const handleUpdate = async (updatedData: EmpleadoBase) => {
    try {
      if (!selectedEmpleado?.id_empleado) {
        throw new Error('No se ha seleccionado un empleado para actualizar');
      }

      // Preparar los datos para la actualización
      const updateFields: Record<string, any> = {};
      
      // Solo incluir campos que realmente han cambiado
      if (updatedData.nombre !== selectedEmpleado.nombre) updateFields.nombre = updatedData.nombre;
      if (updatedData.apellido !== selectedEmpleado.apellido) updateFields.apellido = updatedData.apellido;
      if (updatedData.correo !== selectedEmpleado.correo) updateFields.correo = updatedData.correo;
      if (updatedData.direccion !== selectedEmpleado.direccion) updateFields.direccion = updatedData.direccion;
      if (updatedData.telefono !== selectedEmpleado.telefono) updateFields.telefono = updatedData.telefono;
      if (updatedData.rol_id !== selectedEmpleado.rol_id) updateFields.rol_id = updatedData.rol_id;
      if (updatedData.rut !== selectedEmpleado.rut) updateFields.rut = updatedData.rut;

      // Verificar si hay campos para actualizar
      if (Object.keys(updateFields).length === 0) {
        throw new Error('No se han realizado cambios en los datos');
      }

      // Log the data being sent
      console.log('Datos a enviar:', {
        id: selectedEmpleado.id_empleado,
        data: updateFields
      });

      // Update the employee using the API
      const updatedEmpleado = await empleadoApiFast.update(selectedEmpleado.id_empleado, updateFields);

      // Log the response
      console.log('Respuesta del servidor:', updatedEmpleado);

      // Update local state
      setEmpleados(prev => 
        prev.map(emp => emp.id_empleado === selectedEmpleado.id_empleado ? updatedEmpleado : emp)
      );

      // Close modal and clear selection
      setIsEditModalOpen(false);
      setSelectedEmpleado(null);
      setError(null);
    } catch (err) {
      console.error('Error detallado:', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message || 
                           'Error al actualizar el empleado';
        setError(errorMessage);
      } else {
        setError('Error al actualizar el empleado');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      try {
        await empleadoApiFast.delete(id);
        setEmpleados(prev => prev.filter(emp => emp.id_empleado !== id));
      } catch (err) {
        setError('Error al eliminar el empleado');
        console.error('Error:', err);
      }
    }
  };

  const handleCreateEmpleado = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Obtener los valores directamente de los inputs
      const target = e.currentTarget;
      const formValues = {
        nombre: String(target.nombre.value).trim(),
        apellido: String(target.apellido.value).trim(),
        rut: String(target.rut.value).trim(),
        correo: String(target.correo.value).trim(),
        contrasena: String(target.contrasena.value),
        direccion: String(target.direccion.value).trim() || 'N/A',
        telefono: String(target.telefono.value).trim() || 'N/A',
        rol_id: Number(target.rol_id.value)
      };

      // Validación básica
      if (!formValues.nombre || !formValues.apellido || !formValues.rut || 
          !formValues.correo || !formValues.contrasena || !formValues.rol_id) {
        setError('Todos los campos marcados con * son obligatorios');
        setIsSubmitting(false);
        return;
      }

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formValues.correo)) {
        setError('El formato del correo electrónico no es válido');
        setIsSubmitting(false);
        return;
      }

      // Formateo de RUT (similar al backend)
      let rutFormateado = formValues.rut.replace(/\s/g, '').replace(/\./g, '');
      // Si el RUT no tiene guión y tiene al menos 2 caracteres, insertamos el guión
      if (!rutFormateado.includes('-') && rutFormateado.length >= 2) {
        rutFormateado = rutFormateado.slice(0, -1) + '-' + rutFormateado.slice(-1);
      }
      
      // Validar formato de RUT después de formatear (formato básico: xxxxxxxx-x)
      const rutRegex = /^\d{7,8}-[\dkK]$/;
      if (!rutRegex.test(rutFormateado)) {
        setError('El formato del RUT no es válido (ejemplo: 12345678-9)');
        setIsSubmitting(false);
        return;
      }

      // Validar rol_id
      if (![2, 3, 4, 5].includes(formValues.rol_id)) {
        setError('El rol seleccionado no es válido');
        setIsSubmitting(false);
        return;
      }

      // Log de los datos que se van a enviar
      console.log('Datos del empleado a crear:', {
        ...formValues,
        rut: rutFormateado // Usar el RUT formateado
      });

      // Crear el empleado usando la API
      const nuevoEmpleado = await empleadoApiFast.create({
        ...formValues,
        rut: rutFormateado, // Usar el RUT formateado
        direccion: formValues.direccion === '' ? 'N/A' : formValues.direccion,
        telefono: formValues.telefono === '' ? 'N/A' : formValues.telefono
      });

      console.log('Empleado creado:', nuevoEmpleado);
      setIsAddModalOpen(false);
      
      // Mostrar mensaje de éxito
      alert('Empleado creado con éxito');
      
      // Recargar la página para mostrar el nuevo empleado
      window.location.reload();
    } catch (error: any) {
      console.error('Error detallado al crear empleado:', error);
      
      let mensajeError = 'Error al crear el empleado';
      
      // Extraer mensaje de error detallado si existe
      if (error.message) {
        mensajeError = error.message;
      }
      
      // Si es un error de validación (422) o conflicto (409), mostrar el detalle
      if (error.response) {
        if (error.response.data && error.response.data.detail) {
          mensajeError = error.response.data.detail;
        }
      }
      
      setError(mensajeError);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Empleados</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Añadir Empleado
          </button>
          <button 
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">RUT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {empleados.map((empleado) => (
                <tr key={empleado.id_empleado} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{empleado.id_empleado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium">{`${empleado.nombre} ${empleado.apellido}`}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {empleado.rut ? empleado.rut : 
                      <span className="text-gray-400 italic">No proporcionado</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{empleado.correo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {empleado.telefono ? empleado.telefono : 
                      <span className="text-gray-400 italic">N/A</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {empleado.direccion ? empleado.direccion : 
                      <span className="text-gray-400 italic">N/A</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      empleado.rol_id === 2 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : empleado.rol_id === 3
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : empleado.rol_id === 4
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {roles[empleado.rol_id] || "Desconocido"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(empleado.id_empleado)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      title="Editar"
                    >
                      <FiEdit2 className="inline-block w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(empleado.id_empleado)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Eliminar"
                    >
                      <FiTrash2 className="inline-block w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full relative shadow-xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Añadir Nuevo Empleado</h2>
            <form onSubmit={handleCreateEmpleado} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RUT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="rut"
                  required
                  placeholder="12345678-9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="correo"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="contrasena"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  name="rol_id"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Seleccione un rol</option>
                  <option value="2">Administrador</option>
                  <option value="3">Vendedor</option>
                  <option value="4">Bodeguero</option>
                  <option value="5">Contador</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmpleado && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Editar Empleado</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              const nombre = formData.get('nombre') as string;
              const apellido = formData.get('apellido') as string;
              const correo = formData.get('correo') as string;
              const direccion = formData.get('direccion') as string;
              const telefono = formData.get('telefono') as string;
              const rol_id = parseInt(formData.get('rol_id') as string, 10);
              const rut = formData.get('rut') as string || '';

              if (!nombre || !apellido || !correo || !direccion || !telefono || isNaN(rol_id)) {
                setError('Todos los campos son requeridos excepto RUT');
                return;
              }

              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(correo)) {
                setError('El formato del correo electrónico no es válido');
                return;
              }

              const updateData: EmpleadoBase = {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                correo: correo.trim(),
                direccion: direccion.trim(),
                telefono: telefono.trim(),
                rol_id,
                rut: rut.trim()
              };

              try {
                await handleUpdate(updateData);
              } catch (err) {
                // El error ya se maneja en handleUpdate
                console.error('Error en el formulario:', err);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                  <input
                    name="nombre"
                    defaultValue={selectedEmpleado.nombre}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</label>
                  <input
                    name="apellido"
                    defaultValue={selectedEmpleado.apellido}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RUT</label>
                  <input
                    name="rut"
                    defaultValue={selectedEmpleado.rut}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo</label>
                  <input
                    name="correo"
                    type="email"
                    defaultValue={selectedEmpleado.correo}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                  <input
                    name="direccion"
                    defaultValue={selectedEmpleado.direccion}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                  <input
                    name="telefono"
                    defaultValue={selectedEmpleado.telefono}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol ID</label>
                  <input
                    name="rol_id"
                    type="number"
                    defaultValue={selectedEmpleado.rol_id}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
