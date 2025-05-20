'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isEmpleado, empleadoApiFast } from '@/lib/api';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  detail?: string | Array<{
    type: string;
    loc: string[];
    msg: string;
    input: string;
  }>;
  message?: string;
}

interface FieldError {
  [key: string]: string;
}

const validateEmployeeData = (data: {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  direccion: string;
  telefono: string;
  rol_id: string;
  rut?: string;
}): string | null => {
  const { nombre, apellido, correo, contrasena, direccion, telefono, rol_id, rut } = data;

  if (!nombre?.trim() || !apellido?.trim() || !correo?.trim() || 
      !contrasena || !rol_id) {
    return 'Los campos Nombre, Apellido, Correo, Contraseña y Rol son obligatorios';
  }

  // Validar formato de correo
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(correo)) {
    return 'El formato del correo electrónico no es válido';
  }

  // Validar contraseña
  if (contrasena.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  // Validar teléfono solo si se proporciona
  if (telefono?.trim()) {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    if (!/^\d{8,12}$/.test(telefonoLimpio)) {
      return 'El teléfono debe contener entre 8 y 12 dígitos';
    }
  }

  // Validar rol
  if (!['1', '2', '3', '4'].includes(rol_id)) {
    return 'El rol debe ser un valor entre 1 y 4';
  }

  // Validar RUT si se proporciona
  if (rut?.trim()) {
    if (!/^[0-9]{7,8}-[0-9kK]$/.test(rut.trim())) {
      return 'El formato del RUT no es válido (ej: 12345678-9)';
    }
  }

  return null;
};

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'correo':
        return !value.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/) 
          ? 'Formato de correo inválido' : '';
      case 'contrasena':
        return value.length < 6 
          ? 'La contraseña debe tener al menos 6 caracteres' : '';
      case 'telefono':
        return value.trim() && !value.replace(/\D/g, '').match(/^\d{8,12}$/) 
          ? 'El teléfono debe tener entre 8 y 12 dígitos' : '';
      case 'rut':
        return value && !value.match(/^[0-9]{7,8}-[0-9kK]$/) 
          ? 'Formato de RUT inválido (ej: 12345678-9)' : '';
      case 'rol_id':
        return !value || !['1', '2', '3', '4'].includes(value)
          ? 'Seleccione un rol válido' : '';
      case 'nombre':
      case 'apellido':
        return !value.trim() ? 'Campo requerido' : '';
      default:
        return '';
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const getFieldRequirements = (name: string): string => {
    switch (name) {
      case 'correo':
        return 'Debe ser un correo electrónico válido';
      case 'contrasena':
        return 'Mínimo 6 caracteres';
      case 'telefono':
        return 'Entre 8 y 12 dígitos';
      case 'rut':
        return 'Formato: 12345678-9 (opcional)';
      case 'rol_id':
        return 'Seleccione un rol válido';
      default:
        return 'Campo requerido';
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
      rol_id: formData.get('rol_id') as string,
      rut: formData.get('rut') as string || ''
    };

    // Validate all fields before submitting
    const newFieldErrors: FieldError = {};
    Object.entries(formValues).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        newFieldErrors[key] = error;
      }
    });

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setIsSubmitting(false);
      setError('Por favor, corrija los errores en el formulario');
      return;
    }

    // Validate complete form
    const validationError = validateEmployeeData(formValues);
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const telefonoNum = parseInt(formValues.telefono.replace(/\D/g, ''), 10);
      const rolIdNum = parseInt(formValues.rol_id, 10);

      if (isNaN(telefonoNum) || isNaN(rolIdNum)) {
        setError('Los campos numéricos no son válidos');
        return;
      }

      const nuevoEmpleado = {
        nombre: formValues.nombre.trim(),
        apellido: formValues.apellido.trim(),
        rut: formValues.rut.trim() || undefined,
        correo: formValues.correo.trim(),
        contrasena: formValues.contrasena,
        direccion: formValues.direccion.trim(),
        telefono: telefonoNum,
        rol_id: rolIdNum,
        informe_id: 1
      };

      console.log('Datos a enviar a la API:', nuevoEmpleado);
      await empleadoApiFast.create(nuevoEmpleado);
      
      setIsAddModalOpen(false);
      setError(null);
      setFieldErrors({});
      alert('Empleado creado exitosamente');
    } catch (err) {
      console.error('Error al crear empleado:', err);
      
      if (err instanceof AxiosError) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.log('Error response:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers
        });
        
        const errorData = axiosError.response?.data;
        
        if (axiosError.response?.status === 422) {
          if (Array.isArray(errorData?.detail)) {
            const fieldNames: { [key: string]: string } = {
              nombre: 'Nombre',
              apellido: 'Apellido',
              correo: 'Correo',
              contrasena: 'Contraseña',
              direccion: 'Dirección',
              telefono: 'Teléfono',
              rol_id: 'Rol',
              rut: 'RUT'
            };
            
            const errorMessages = errorData.detail
              .map(error => {
                let field = '';
                if (error.loc && Array.isArray(error.loc)) {
                  field = error.loc[error.loc.length - 1];
                }
                const fieldName = fieldNames[field] || field;
                
                // Update field-level errors
                if (field && Object.keys(fieldNames).includes(field)) {
                  setFieldErrors(prev => ({
                    ...prev,
                    [field]: error.msg
                  }));
                }
                
                return `${fieldName}: ${error.msg}`;
              })
              .join('; ');
            
            setError(`Errores de validación: ${errorMessages}`);
          } else if (typeof errorData?.detail === 'string') {
            setError(`Error de validación: ${errorData.detail}`);
          } else {
            setError('Error de validación: verifica que todos los campos tengan el formato correcto');
          }
        } else if (typeof errorData?.detail === 'string') {
          setError(errorData.detail);
        } else if (errorData?.message) {
          setError(errorData.message);
        } else {
          setError(`Error al crear el empleado (${axiosError.response?.status || 'desconocido'})`);
        }
      } else {
        setError('Error inesperado al crear el empleado');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isLoading && (!user || !isEmpleado(user) || user.rol_id !== 2)) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderField = (
    name: string, 
    label: string, 
    type: string = 'text', 
    required: boolean = true,
    placeholder?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        onChange={handleFieldChange}
        title={getFieldRequirements(name)}
        placeholder={placeholder || `Ingrese ${label.toLowerCase()}`}
        className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 dark:text-white dark:placeholder-gray-400 ${
          fieldErrors[name]
            ? 'border-red-300 focus:border-red-500 dark:border-red-600'
            : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600'
        }`}
        required={required}
      />
      {fieldErrors[name] && (
        <p className="mt-1 text-sm text-red-500">{fieldErrors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Ventas totales</span>
              <span className="font-bold">$24,568</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Clientes nuevos</span>
              <span className="font-bold">156</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Órdenes pendientes</span>
              <span className="font-bold">23</span>
            </div>
          </div>
        </div>
        
        {/* Gestión de Productos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Productos</h2>
          <div className="space-y-2">            <button 
              onClick={() => router.push('/admin/inventario')}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Ver inventario
            </button>
            <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
              Añadir producto
            </button>
            <button className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors">
              Actualizar precios
            </button>
          </div>
        </div>
        
        {/* Gestión de Usuarios */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Usuarios</h2>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/clientes')}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
            >
              Ver clientes
            </button>
            <button
              onClick={() => router.push('/admin/empleados')}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Ver empleados
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors"
            >
              Añadir empleado
            </button>
          </div>
        </div>
      </div>
      
      {/* Órdenes Recientes */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Órdenes Recientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#ORD-{1000 + index}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">Cliente Ejemplo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date().toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${Math.floor(Math.random() * 1000)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completada
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para agregar empleado */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-3 dark:text-white">Agregar Nuevo Empleado</h2>
            <form onSubmit={handleCreateEmpleado} className="space-y-3" noValidate>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative text-sm" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              {renderField('nombre', 'Nombre')}
              {renderField('apellido', 'Apellido')}
              {renderField('rut', 'RUT', 'text', false, '12345678-9')}
              {renderField('correo', 'Correo', 'email', true, 'ejemplo@correo.com')}
              {renderField('contrasena', 'Contraseña', 'password', true, 'Mínimo 6 caracteres')}
              {renderField('direccion', 'Dirección', 'text', false)}
              {renderField('telefono', 'Teléfono', 'tel', false, 'Entre 8 y 12 dígitos')}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rol <span className="text-red-500">*</span>
                </label>                <select
                  name="rol_id"
                  onChange={handleFieldChange}
                  className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    fieldErrors.rol_id
                      ? 'border-red-300 focus:border-red-500 dark:border-red-600'
                      : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600'
                  }`}
                  required
                >
                  <option value="" className="text-gray-500">Seleccione un rol</option>
                  <option value="1" className="text-gray-900 dark:text-white">Empleado Regular</option>
                  <option value="2" className="text-gray-900 dark:text-white">Administrador</option>
                  <option value="3" className="text-gray-900 dark:text-white">Bodeguero</option>
                  <option value="4" className="text-gray-900 dark:text-white">Contador</option>
                </select>
                {fieldErrors.rol_id && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.rol_id}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setError(null);
                    setFieldErrors({});
                  }}
                  disabled={isSubmitting}
                  className={`py-2 px-4 rounded font-bold ${
                    isSubmitting 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-300 hover:bg-gray-400 text-black'
                  }`}
                >
                  Cancelar
                </button>                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`py-2 px-4 rounded font-bold transition-all duration-200 ${
                    isSubmitting
                      ? 'bg-blue-400 text-white opacity-50 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
