export default function Loading() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
      <span className="ml-3 text-gray-700 dark:text-gray-300">Cargando...</span>
    </div>
  );
} 