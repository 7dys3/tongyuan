// app/knowledge-bases/page.tsx
import KnowledgeBaseListClient from "./components/KnowledgeBaseListClient";

export default async function KnowledgeBasesPage() {
  // Fetch initial knowledge bases data here if needed for SSR, or handle in client component
  // For now, we assume client-side fetching primarily

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">知识库管理</h1>
      <KnowledgeBaseListClient />
    </div>
  );
}

