// app/knowledge-bases/[kb_id]/page.tsx
import KnowledgeBaseDetailClient from "./components/KnowledgeBaseDetailClient";

interface KnowledgeBaseDetailPageProps {
  params: {
    kb_id: string;
  };
}

export default async function KnowledgeBaseDetailPage({ params }: KnowledgeBaseDetailPageProps) {
  const { kb_id } = params;

  // You could fetch knowledge base details here for SSR if needed
  // For now, primary data fetching will be client-side in KnowledgeBaseDetailClient

  return (
    <div className="container mx-auto py-8">
      <KnowledgeBaseDetailClient kbId={kb_id} />
    </div>
  );
}

