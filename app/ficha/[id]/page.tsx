import { Builder } from "@/components/builder/Builder";

// A ficha é carregada da conta no navegador; o servidor só entrega a casca.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Builder id={id} />;
}
