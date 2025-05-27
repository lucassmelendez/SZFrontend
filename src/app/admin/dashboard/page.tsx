'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  isEmpleado, 
  empleadoApiFast, 
  apiFast, 
  pedidoApiFast, 
  pedidoProductoApiFast, 
  Pedido,
  productoApi
} from '@/lib/api';
import { AxiosError } from 'axios';
import { FiUsers, FiPackage, FiShoppingCart, FiDownload } from 'react-icons/fi';

interface ApiErrorResponse {
  detail?: string | Array<{
    type: string;
    loc: string[];
    msg: string;
    input: string;
  }>;
  message?: string;
}

interface Cliente {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion: string;
}

interface PedidoConDetalles extends Omit<Pedido, 'cliente'> {
  total: number;
  cliente: Cliente;
  productos: Array<{
    id_producto: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
}

interface Estadisticas {
  ventas_totales: number;
  total_clientes: number;
  ordenes_pendientes: number;
}

const estadosEnvio: Record<number, string> = {
  1: "Enviado",
  2: "Pendiente",
  3: "Recibido"
};

const mediosPago: Record<number, string> = {
  1: "Transferencia",
  2: "Webpay"
};

const getEstadoPago = (id_estado: number) => {
  return {
    texto: id_estado === 1 ? 'Pagado' : 'Pendiente',
    color: id_estado === 1 ? 'green' : 'yellow'
  };
};

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
  const [pedidos, setPedidos] = useState<PedidoConDetalles[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    ventas_totales: 0,
    total_clientes: 0,
    ordenes_pendientes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener pedidos recientes
        const pedidosResponse = await pedidoApiFast.getAll();
        console.log('Pedidos obtenidos del servidor:', pedidosResponse);
        
        // Procesamos cada pedido para obtener más detalles
        const pedidosConDetalles = await Promise.all(
          pedidosResponse.map(async (pedido) => {
            // Obtenemos los productos del pedido
            const idPedido = pedido.id_pedido || 0;
            console.log(`Obteniendo productos para pedido ${idPedido}`);
            
            const pedidoProductos = await pedidoProductoApiFast.getByPedido(idPedido);
            console.log(`Productos obtenidos para pedido ${idPedido}:`, pedidoProductos);
            
            // Obtener información de productos utilizando productoApi (NO apiFast)
            const productosConDetalles = await Promise.all(
              pedidoProductos.map(async (pp) => {
                try {
                  // Usar productoApi que sabemos que funciona
                  const producto = await productoApi.getById(pp.id_producto);
                  console.log(`Producto ${pp.id_producto} obtenido correctamente con nombre:`, producto.nombre);
                  
                  return { 
                    ...pp, 
                    nombre: producto.nombre || `Producto #${pp.id_producto}`,
                    subtotal: pp.subtotal || pp.precio_unitario * pp.cantidad
                  };
                } catch (err) {
                  console.error(`Error al obtener producto ${pp.id_producto}:`, err);
                  return { 
                    ...pp, 
                    nombre: `Producto #${pp.id_producto}`,
                    subtotal: pp.subtotal || pp.precio_unitario * pp.cantidad
                  };
                }
              })
            );
            
            // Calculamos el total sumando los subtotales
            const total = productosConDetalles.reduce(
              (acc, curr) => acc + (curr.subtotal || curr.precio_unitario * curr.cantidad), 
              0
            );
            console.log(`Total calculado para pedido ${idPedido}:`, total);
            
            // Obtenemos los datos del cliente
            const clienteResponse = await apiFast.get(`/clientes/${pedido.id_cliente}`);
            const cliente = clienteResponse.data as Cliente;
            
            const pedidoConDetalles = {
              ...pedido,
              total: total || 0,
              productos: productosConDetalles,
              cliente
            };
            
            console.log(`Pedido ${idPedido} procesado:`, pedidoConDetalles);
            return pedidoConDetalles;
          })
        );
        
        setPedidos(pedidosConDetalles);
        console.log('Todos los pedidos procesados:', pedidosConDetalles);

        // Obtener total de clientes
        const clientesResponse = await apiFast.get('/clientes');
        const totalClientes = clientesResponse.data.length;

        // Calcular estadísticas básicas
        const ventasTotales = pedidosConDetalles.reduce((sum, pedido) => sum + (pedido.total || 0), 0);
        const ordenesPendientes = pedidosConDetalles.filter(
          pedido => pedido.id_estado_envio === 2
        ).length;

        setEstadisticas({
          ventas_totales: ventasTotales,
          total_clientes: totalClientes,
          ordenes_pendientes: ordenesPendientes
        });
        
        console.log('Estadísticas calculadas:', {
          ventas_totales: ventasTotales,
          total_clientes: totalClientes,
          ordenes_pendientes: ordenesPendientes
        });
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || !isEmpleado(user) || user.rol_id !== 2)) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const getEstadoPedido = (id_estado: number, id_estado_envio: number) => {
    switch (id_estado_envio) {
      case 1:
        return { texto: 'preparado', color: 'blue' };
      case 2:
        return { texto: 'Pendiente', color: 'yellow' };
      case 3:
        return { texto: 'Entregado', color: 'green' };
      case 4:
        return { texto: 'despachado', color: 'purple' };
      default:
        return { texto: 'Pendiente', color: 'yellow' };
    }
  };

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
    const newFieldErrors: { [key: string]: string } = {};
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

  const renderField = (
    name: string, 
    label: string, 
    type: string = 'text', 
    required: boolean = true,
    placeholder?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        onChange={handleFieldChange}
        title={getFieldRequirements(name)}
        placeholder={placeholder || `Ingrese ${label.toLowerCase()}`}
        className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500${
          fieldErrors[name]
            ? 'border-red-300 focus:border-red-500'
            : 'border-gray-300 focus:border-indigo-500'
        }`}
        required={required}
      />
      {fieldErrors[name] && (
        <p className="mt-1 text-sm text-red-500">{fieldErrors[name]}</p>
      )}
    </div>
  );

  const generateFinancialReport = () => {
    // Crear un archivo CSV que se pueda abrir con Excel
    const fecha = new Date().toLocaleDateString('es-CL');
    const hora = new Date().toLocaleTimeString('es-CL');
    
    // Encabezados del CSV
    let csvContent = 'INFORME FINANCIERO - SPINZONE\n';
    csvContent += 'Generado el:,' + fecha + ' ' + hora + '\n\n';
    
    // Sección de resumen
    csvContent += 'RESUMEN DE VENTAS\n';
    csvContent += 'Concepto,Valor\n';
    csvContent += 'Ventas totales,' + estadisticas.ventas_totales + '\n';
    csvContent += 'Total de clientes,' + estadisticas.total_clientes + '\n';
    csvContent += 'Órdenes pendientes,' + estadisticas.ordenes_pendientes + '\n\n';
    
    // Sección de pedidos
    csvContent += 'DETALLE DE PEDIDOS RECIENTES\n';
    csvContent += 'ID Pedido,Cliente,Correo,Fecha,Estado Pago,Estado Envío,Medio de Pago,Monto Total\n';
    
    // Detalles de los pedidos
    pedidos
      .sort((a, b) => (b.id_pedido || 0) - (a.id_pedido || 0))
      .forEach((pedido) => {
        const fechaPedido = new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es-CL');
        csvContent += `${pedido.id_pedido || ''},`;
        csvContent += `"${pedido.cliente.nombre} ${pedido.cliente.apellido}",`;
        csvContent += `${pedido.cliente.correo},`;
        csvContent += `${fechaPedido},`;
        csvContent += `${getEstadoPago(pedido.id_estado).texto},`;
        csvContent += `${getEstadoPedido(pedido.id_estado, pedido.id_estado_envio).texto},`;
        csvContent += `${mediosPago[pedido.medio_pago_id] || "Desconocido"},`;
        csvContent += `${pedido.total}\n`;
      });
    
    // Agregar una sección de productos
    csvContent += '\nDETALLE DE PRODUCTOS POR PEDIDO\n';
    csvContent += 'ID Pedido,Producto,Cantidad,Precio Unitario,Subtotal\n';
    
    // Detalles de productos por pedido
    pedidos
      .sort((a, b) => (b.id_pedido || 0) - (a.id_pedido || 0))
      .forEach((pedido) => {
        pedido.productos.forEach(producto => {
          csvContent += `${pedido.id_pedido || ''},`;
          csvContent += `"${producto.nombre}",`;
          csvContent += `${producto.cantidad},`;
          csvContent += `${producto.precio_unitario},`;
          csvContent += `${producto.subtotal || producto.precio_unitario * producto.cantidad}\n`;
        });
      });

    // Función para manejar caracteres especiales en CSV
    const escapeCSV = (text: string | number | undefined): string | number | undefined => {
      if (typeof text !== 'string') return text;
      // Si contiene comas, comillas o saltos de línea, envolver en comillas
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };
    
    // Crear el blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace para descargar
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_financiero_spinzone_${fecha.replace(/\//g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Estadísticas */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FiShoppingCart className="w-6 h-6" />
            Estadísticas
          </h2>
          <div className="space-y-4 flex-grow">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ventas totales</span>
                <span className="font-bold text-blue-600">{formatCurrency(estadisticas.ventas_totales)}</span>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de clientes</span>
                <span className="font-bold text-green-600">{estadisticas.total_clientes}</span>
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Órdenes pendientes</span>
                <span className="font-bold text-amber-600">{estadisticas.ordenes_pendientes}</span>
              </div>
            </div>
            <button
              onClick={generateFinancialReport}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 transition-colors text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <FiDownload className="text-white" />
              <span>Descargar Informe Financiero</span>
            </button>
          </div>
        </div>
        
        {/* Gestión de Usuarios */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FiUsers className="w-6 h-6" />
            Gestión
          </h2>
          <div className="flex flex-col justify-between flex-grow space-y-2">
            <button
              onClick={() => router.push('/admin/empleados')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 px-4 rounded-lg transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Gestionar empleados</span>
              </div>
              <span className="text-white font-medium">→</span>
            </button>
            <button
              onClick={() => router.push('/admin/clientes')}
              className="w-full bg-purple-600 hover:bg-purple-700 py-6 px-4 rounded-lg transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Ver clientes</span>
              </div>
              <span className="text-white font-medium">→</span>
            </button>
            <button
              onClick={() => router.push('/admin/inventario')}
              className="w-full bg-green-600 hover:bg-green-700 py-6 px-4 rounded-lg transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Gestionar inventario</span>
              </div>
              <span className="text-white font-medium">→</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Órdenes Recientes */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <FiShoppingCart className="w-6 h-6" />
          Órdenes Recientes
        </h2>
        {error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : (
          <>
            {/* Tabla para pantallas medianas y grandes */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Envío</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medio de Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pedidos
                    .sort((a, b) => (b.id_pedido || 0) - (a.id_pedido || 0))
                    .map((pedido) => {
                    const estadoPago = getEstadoPago(pedido.id_estado);
                    const estado = getEstadoPedido(pedido.id_estado, pedido.id_estado_envio);
                    return (
                      <tr key={pedido.id_pedido} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{pedido.id_pedido}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <div className="font-medium">{`${pedido.cliente.nombre} ${pedido.cliente.apellido}`}</div>
                            <div className="text-xs text-gray-500">{pedido.cliente.correo}</div>
                            <div className="text-xs text-gray-500">{pedido.cliente.telefono}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {pedido.productos && pedido.productos.length > 0 ? (
                            <div className="max-h-32 overflow-y-auto">
                              <ul className="space-y-1">
                                {pedido.productos.map(producto => (
                                  <li key={producto.id_producto} className="text-xs flex justify-between">
                                    <span className="font-medium">{producto.nombre} x{producto.cantidad}</span>
                                    <span className="text-gray-500 ml-2">{formatCurrency(producto.subtotal || 0)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Sin productos</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatCurrency(pedido.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            estadoPago.color === 'green' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {estadoPago.texto}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            estado.color === 'green' 
                              ? 'bg-green-100 text-green-800'
                              : estado.color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : estado.color === 'blue'
                              ? 'bg-blue-100 text-blue-800'
                              : estado.color === 'purple'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {estado.texto}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {mediosPago[pedido.medio_pago_id] || "Desconocido"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista de tarjetas para dispositivos móviles */}
            <div className="md:hidden space-y-4">
              {pedidos
                .sort((a, b) => (b.id_pedido || 0) - (a.id_pedido || 0))
                .map((pedido) => {
                  const estadoPago = getEstadoPago(pedido.id_estado);
                  const estado = getEstadoPedido(pedido.id_estado, pedido.id_estado_envio);
                  return (
                    <div key={pedido.id_pedido} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                      {/* Encabezado de la tarjeta */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-lg font-bold text-blue-600">#{pedido.id_pedido}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                        </div>
                      </div>
                      
                      {/* Datos del cliente */}
                      <div className="mb-3">
                        <div className="font-medium">{`${pedido.cliente.nombre} ${pedido.cliente.apellido}`}</div>
                        <div className="text-xs text-gray-500">{pedido.cliente.correo}</div>
                        <div className="text-xs text-gray-500">{pedido.cliente.telefono}</div>
                      </div>
                      
                      {/* Estados del pedido */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          estadoPago.color === 'green' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {estadoPago.texto}
                        </span>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          estado.color === 'green' 
                            ? 'bg-green-100 text-green-800'
                            : estado.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : estado.color === 'blue'
                            ? 'bg-blue-100 text-blue-800'
                            : estado.color === 'purple'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {estado.texto}
                        </span>
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {mediosPago[pedido.medio_pago_id] || "Desconocido"}
                        </span>
                      </div>
                      
                      {/* Productos */}
                      <div className="border-t border-gray-200 pt-3 mb-3">
                        <div className="font-medium text-sm mb-2">Productos:</div>
                        {pedido.productos && pedido.productos.length > 0 ? (
                          <div className="max-h-32 overflow-y-auto">
                            <ul className="space-y-1">
                              {pedido.productos.map(producto => (
                                <li key={producto.id_producto} className="text-xs flex justify-between">
                                  <span className="font-medium">{producto.nombre} x{producto.cantidad}</span>
                                  <span className="text-gray-500 ml-2">{formatCurrency(producto.subtotal || 0)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Sin productos</span>
                        )}
                      </div>
                      
                      {/* Total */}
                      <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                        <span className="font-medium text-sm">Total:</span>
                        <span className="font-bold text-lg">{formatCurrency(pedido.total)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>

      {/* Modal para agregar empleado */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-3">Agregar Nuevo Empleado</h2>
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
                <label className="block text-sm font-medium text-gray-700">
                  Rol <span className="text-red-500">*</span>
                </label>                <select
                  name="rol_id"
                  onChange={handleFieldChange}
                  className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 bg-white text-gray-900 ${
                    fieldErrors.rol_id
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  required
                >
                  <option value="" className="text-gray-500">Seleccione un rol</option>
                  <option value="1" className="text-gray-900">Empleado Regular</option>
                  <option value="2" className="text-gray-900">Administrador</option>
                  <option value="3" className="text-gray-900">Bodeguero</option>
                  <option value="4" className="text-gray-900">Contador</option>
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
