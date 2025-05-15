// app/knowledge-bases/components/KnowledgeBaseListClient.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search, Trash2, Eye, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { apiService } from "@/services/apiService"; // Assuming an apiService for backend calls

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  document_count?: number; // Optional, might be fetched separately or with the list
}

export default function KnowledgeBaseListClient() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [filteredKnowledgeBases, setFilteredKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  const [newKbDescription, setNewKbDescription] = useState("");

  const [kbToDelete, setKbToDelete] = useState<KnowledgeBase | null>(null);

  const fetchKnowledgeBases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<KnowledgeBase[]>("/knowledgebases");
      // Simulate document_count for now, or fetch it if API provides
      const dataWithDocCount = data.map((kb: KnowledgeBase) => ({ ...kb, document_count: Math.floor(Math.random() * 10) }));
      setKnowledgeBases(dataWithDocCount);
      setFilteredKnowledgeBases(dataWithDocCount);
    } catch (err: any) {
      setError(err.message || "Failed to fetch knowledge bases");
      toast({
        title: "Error",
        description: err.message || "Failed to fetch knowledge bases.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = knowledgeBases.filter(item => {
      return (
        item.name.toLowerCase().includes(lowercasedFilter) ||
        (item.description && item.description.toLowerCase().includes(lowercasedFilter))
      );
    });
    setFilteredKnowledgeBases(filteredData);
  }, [searchTerm, knowledgeBases]);

  const handleCreateKnowledgeBase = async () => {
    if (!newKbName.trim()) {
      toast({
        title: "Validation Error",
        description: "Knowledge base name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    try {
      const newKb = await apiService.post<KnowledgeBase>("/knowledgebases", { name: newKbName, description: newKbDescription });
      // setKnowledgeBases(prev => [...prev, { ...newKb, document_count: 0 }]);
      // setFilteredKnowledgeBases(prev => [...prev, { ...newKb, document_count: 0 }]);
      fetchKnowledgeBases(); // Re-fetch to get the latest list including the new one
      toast({
        title: "Success",
        description: `Knowledge base "${newKb.name}" created successfully.`,
      });
      setIsCreateDialogOpen(false);
      setNewKbName("");
      setNewKbDescription("");
    } catch (err: any) {
      toast({
        title: "Error Creating Knowledge Base",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteKnowledgeBase = async () => {
    if (!kbToDelete) return;
    try {
      await apiService.delete(`/knowledgebases/${kbToDelete.id}`);
      // setKnowledgeBases(prev => prev.filter(kb => kb.id !== kbToDelete.id));
      // setFilteredKnowledgeBases(prev => prev.filter(kb => kb.id !== kbToDelete.id));
      fetchKnowledgeBases(); // Re-fetch to update the list
      toast({
        title: "Success",
        description: `Knowledge base "${kbToDelete.name}" deleted successfully.`,
      });
      setKbToDelete(null);
    } catch (err: any) {
      toast({
        title: "Error Deleting Knowledge Base",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><RefreshCw className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading knowledge bases...</span></div>;
  }

  if (error) {
    return <div className="text-red-500 flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-xl">Error loading knowledge bases: {error}</p>
        <Button onClick={fetchKnowledgeBases} className="mt-4">Try Again</Button>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="搜索知识库名称或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setNewKbName(""); setNewKbDescription(""); setIsCreateDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-5 w-5" /> 创建知识库
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>创建新知识库</DialogTitle>
              <DialogDescription>
                为您的新知识库命名并添加可选的描述。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  名称
                </Label>
                <Input id="name" value={newKbName} onChange={(e) => setNewKbName(e.target.value)} className="col-span-3" placeholder="例如：公司政策" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  描述
                </Label>
                <Input id="description" value={newKbDescription} onChange={(e) => setNewKbDescription(e.target.value)} className="col-span-3" placeholder="(可选) 例如：包含所有最新的公司内部政策文档" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button onClick={handleCreateKnowledgeBase}>创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filteredKnowledgeBases.length === 0 && !isLoading ? (
        <div className="text-center text-gray-500 py-10">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <p>未找到知识库。</p>
          {knowledgeBases.length > 0 && <p className="text-sm">请尝试更改搜索条件。</p>}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">名称</TableHead>
                <TableHead className="w-[40%]">描述</TableHead>
                <TableHead className="w-[15%]">文档数量</TableHead>
                <TableHead className="text-right w-[15%]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKnowledgeBases.map((kb) => (
                <TableRow key={kb.id}>
                  <TableCell className="font-medium">
                    <Link href={`/knowledge-bases/${kb.id}`} className="hover:underline text-blue-600">
                      {kb.name}
                    </Link>
                  </TableCell>
                  <TableCell>{kb.description || "-"}</TableCell>
                  <TableCell>{kb.document_count ?? "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/knowledge-bases/${kb.id}`} passHref>
                      <Button variant="ghost" size="icon" title="查看详情">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </Link>
                    {/* Edit functionality can be added later if needed */}
                    {/* <Button variant="ghost" size="icon" title="编辑">
                      <Edit className="h-5 w-5" />
                    </Button> */}
                    <Dialog open={kbToDelete?.id === kb.id} onOpenChange={(isOpen) => !isOpen && setKbToDelete(null)}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="删除" onClick={() => setKbToDelete(kb)}>
                                <Trash2 className="h-5 w-5 text-red-500" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>确认删除</DialogTitle>
                                <DialogDescription>
                                    您确定要删除知识库 "{kb.name}" 吗？此操作无法撤销，所有关联的文档和数据都将被永久删除。
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setKbToDelete(null)}>取消</Button>
                                <Button variant="destructive" onClick={handleDeleteKnowledgeBase}>删除</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

