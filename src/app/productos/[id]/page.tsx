// Este archivo es un Server Component por defecto en Next.js 13+
import { ProductoDetailClient } from './client-page';

export default function ProductoDetailPage({ params }: { params: { id: string } }) {
  // Extrae el ID y pásalo como prop al componente cliente
  return <ProductoDetailClient id={params.id} />;
} 