// Este archivo es un Server Component por defecto en Next.js 13+
import { CategoriaClient } from './client-page';

export default function CategoriaPage({ params }: { params: { categoriaId: string } }) {
  // Extrae el ID y pásalo como prop al componente cliente
  return <CategoriaClient categoriaId={params.categoriaId} />;
}