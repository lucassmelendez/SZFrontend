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

interface Empleado extends EmpleadoBase {
  id_empleado: number;
  contrasena?: string;
  informe_id?: number;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

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

    const formData = new FormData(e.currentTarget);
    const formValues = {
      nombre: formData.get('nombre') as string,
      apellido: formData.get('apellido') as string,
      correo: formData.get('correo') as string,
      contrasena: formData.get('contrasena') as string,
      direccion: formData.get('direccion') as string,
      telefono: formData.get('telefono') as string,
      rol_id: parseInt(formData.get('rol_id') as string),
      rut: formData.get('rut') as string || ''
    };

    try {
      const nuevoEmpleado = await empleadoApiFast.create(formValues);
      setEmpleados(prev => [...prev, nuevoEmpleado]);
      setIsAddModalOpen(false);
      setError(null);
      setFieldErrors({});
    } catch (err) {
      console.error('Error al crear empleado:', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(axiosError.response?.data?.detail || 'Error al crear el empleado');
      } else {
        setError('Error inesperado al crear el empleado');
      }
    } finally {
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Apellido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">RUT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {empleados.map((empleado) => (
                <tr key={empleado.id_empleado} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{empleado.id_empleado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{empleado.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{empleado.apellido}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{empleado.rut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{empleado.correo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{empleado.direccion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{empleado.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{empleado.rol_id}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Agregar Nuevo Empleado</h2>
            <form onSubmit={handleCreateEmpleado} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RUT (opcional)</label>
                <input
                  type="text"
                  name="rut"
                  placeholder="12345678-9"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo</label>
                <input
                  type="email"
                  name="correo"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                <input
                  type="password"
                  name="contrasena"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                <select
                  name="rol_id"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Seleccione un rol</option>
                  <option value="1">Empleado Regular</option>
                  <option value="2">Administrador</option>
                  <option value="3">Bodeguero</option>
                  <option value="4">Contador</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setError(null);
                    setFieldErrors({});
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmpleado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
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
