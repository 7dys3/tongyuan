// app/knowledge-bases/[kb_id]/components/KnowledgeBaseDetailClient.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, Trash2, FileText, AlertTriangle, CheckCircle2, RefreshCw, Info, Search, ArrowLeft, Edit2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { apiService } from "@/services/apiService";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  name: string;
  uploaded_at: string;
  file_size: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error_message?: string | null;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  // documents?: Document[]; // Documents will be fetched separately
}

interface KnowledgeBaseDetailClientProps {
  kbId: string;
}

const POLLING_INTERVAL = 5000; // 5 seconds for status polling

export default function KnowledgeBaseDetailClient({ kbId }: KnowledgeBaseDetailClientProps) {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingKb, setIsLoadingKb] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [errorKb, setErrorKb] = useState<string | null>(null);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isEditKbDialogOpen, setIsEditKbDialogOpen] = useState(false);
  const [editKbName, setEditKbName] = useState("");
  const [editKbDescription, setEditKbDescription] = useState("");

  const fetchKnowledgeBaseDetails = async () => {
    setIsLoadingKb(true);
    setErrorKb(null);
    try {
      const data = await apiService.get<KnowledgeBase>(`/knowledgebases/${kbId}`);
      setKnowledgeBase(data);
      setEditKbName(data.name);
      setEditKbDescription(data.description || "");
    } catch (err: any) {
      setErrorKb(err.message || "Failed to fetch knowledge base details");
      toast({
        title: "Error",
        description: err.message || "Failed to load knowledge base details.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingKb(false);
    }
  };

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    setErrorDocs(null);
    try {
      const data = await apiService.get<Document[]>(`/knowledgebases/${kbId}/documents`);
      setDocuments(data);
      setFilteredDocuments(data);
      // Start polling if there are pending/processing documents
      if (data.some(doc => doc.status === "PENDING" || doc.status === "PROCESSING")) {
        startPolling();
      }
    } catch (err: any) {
      setErrorDocs(err.message || "Failed to fetch documents");
      toast({
        title: "Error",
        description: err.message || "Failed to load documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const pollDocumentStatus = async () => {
    try {
      const currentDocs = await apiService.get<Document[]>(`/knowledgebases/${kbId}/documents`);
      setDocuments(currentDocs);
      setFilteredDocuments(prevFiltered => {
        const updatedFiltered = prevFiltered.map((fd: Document) => {
          const updatedDoc = currentDocs.find((cd: Document) => cd.id === fd.id);
          return updatedDoc ? updatedDoc : fd;
        });
        // Add any new documents that might have appeared
        currentDocs.forEach((cd: Document) => {
          if (!updatedFiltered.find((ufd: Document) => ufd.id === cd.id)) {
            updatedFiltered.push(cd);
          }
        });
        return updatedFiltered;
      });

      if (!currentDocs.some(doc => doc.status === "PENDING" || doc.status === "PROCESSING")) {
        stopPolling();
      }
    } catch (error) {
      console.error("Polling error:", error);
      // Optionally, notify user about polling issues, or just retry silently
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(pollDocumentStatus, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    fetchKnowledgeBaseDetails();
    fetchDocuments();
    return () => stopPolling(); // Cleanup on unmount
  }, [kbId]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = documents.filter(item => item.name.toLowerCase().includes(lowercasedFilter));
    setFilteredDocuments(filteredData);
  }, [searchTerm, documents]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilesToUpload(event.target.files);
  };

  const handleUploadDocuments = async () => {
    if (!filesToUpload || filesToUpload.length === 0) {
      toast({ title: "No files selected", description: "Please select files to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    setUploadProgress({});
    const uploadPromises = Array.from(filesToUpload).map(file => {
      const formData = new FormData();
      formData.append("file", file);
      return apiService.post(`/knowledgebases/${kbId}/documents/upload`, formData)
      .then(() => {
        toast({ title: "Upload Success", description: `File "${file.name}" uploaded.` });
      })
      .catch((err: any) => {
        toast({ title: `Upload Failed: ${file.name}`, description: err.message || "An error occurred.", variant: "destructive" });
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // Indicate error
      });
    });

    try {
      await Promise.all(uploadPromises);
    } finally {
      setIsUploading(false);
      setIsUploadDialogOpen(false);
      setFilesToUpload(null);
      fetchDocuments(); // Refresh document list
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      await apiService.delete(`/knowledgebases/${kbId}/documents/${docToDelete.id}`);
      fetchDocuments(); // Refresh document list
      toast({ title: "Success", description: `Document "${docToDelete.name}" deleted successfully.` });
      setDocToDelete(null);
    } catch (err: any) {
      toast({ title: "Error Deleting Document", description: err.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleUpdateKnowledgeBase = async () => {
    if (!knowledgeBase || !editKbName.trim()) {
        toast({ title: "Validation Error", description: "Knowledge base name cannot be empty.", variant: "destructive" });
        return;
    }
    try {
        const updatedKb = await apiService.put<KnowledgeBase>(`/knowledgebases/${kbId}`, { name: editKbName, description: editKbDescription });
        setKnowledgeBase(updatedKb);
        toast({ title: "Success", description: `Knowledge base "${updatedKb.name}" updated successfully.` });
        setIsEditKbDialogOpen(false);
    } catch (err: any) {
        toast({ title: "Error Updating Knowledge Base", description: err.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300"><RefreshCw className="mr-1 h-3 w-3 animate-spin" />Pending</Badge>;
      case "PROCESSING":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300"><RefreshCw className="mr-1 h-3 w-3 animate-spin" />Processing</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>;
      case "FAILED":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoadingKb || !knowledgeBase) {
    return <div className="flex justify-center items-center h-64"><RefreshCw className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading knowledge base details...</span></div>;
  }

  if (errorKb) {
    return <div className="text-red-500 flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-xl">Error loading knowledge base: {errorKb}</p>
        <Button onClick={fetchKnowledgeBaseDetails} className="mt-4">Try Again</Button>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" asChild>
            <Link href="/knowledge-bases"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Link>
        </Button>
        <Dialog open={isEditKbDialogOpen} onOpenChange={setIsEditKbDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => {
                    setEditKbName(knowledgeBase.name);
                    setEditKbDescription(knowledgeBase.description || "");
                    setIsEditKbDialogOpen(true);
                }}>
                    <Edit2 className="mr-2 h-4 w-4" /> Edit Knowledge Base
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Knowledge Base: {knowledgeBase.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-kb-name" className="text-right">Name</Label>
                        <Input id="edit-kb-name" value={editKbName} onChange={(e) => setEditKbName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-kb-desc" className="text-right">Description</Label>
                        <Input id="edit-kb-desc" value={editKbDescription} onChange={(e) => setEditKbDescription(e.target.value)} className="col-span-3" placeholder="(Optional)"/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleUpdateKnowledgeBase}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 p-6 border rounded-lg bg-slate-50">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
            {knowledgeBase.name}
        </h1>
        <p className="text-gray-600">{knowledgeBase.description || "No description provided."}</p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Documents</h2>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="搜索文档名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setFilesToUpload(null); setUploadProgress({}); setIsUploadDialogOpen(true);}}>
              <UploadCloud className="mr-2 h-5 w-5" /> 上传文档
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>上传新文档到 "{knowledgeBase.name}"</DialogTitle>
              <DialogDescription>
                选择一个或多个文件 (PDF, DOCX, TXT) 上传到此知识库。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-1.5">
                <Label htmlFor="documents">选择文件</Label>
                <Input id="documents" type="file" multiple onChange={handleFileChange} accept=".pdf,.docx,.txt" />
              </div>
              {filesToUpload && Array.from(filesToUpload).map(file => (
                <div key={file.name} className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                    {uploadProgress[file.name] > 0 && uploadProgress[file.name] <= 100 && <span className="text-sm">{uploadProgress[file.name]}%</span>}
                    {uploadProgress[file.name] === -1 && <span className="text-sm text-red-500">Error</span>}
                  </div>
                  {uploadProgress[file.name] > 0 && uploadProgress[file.name] <= 100 && <Progress value={uploadProgress[file.name]} className="h-2" />}
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isUploading}>取消</Button>
              </DialogClose>
              <Button onClick={handleUploadDocuments} disabled={isUploading || !filesToUpload || filesToUpload.length === 0}>
                {isUploading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "开始上传"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingDocs ? (
         <div className="flex justify-center items-center h-64"><RefreshCw className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading documents...</span></div>
      ) : errorDocs ? (
        <div className="text-red-500 flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl">Error loading documents: {errorDocs}</p>
            <Button onClick={fetchDocuments} className="mt-4">Try Again</Button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center text-gray-500 py-10 border rounded-lg">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <p>此知识库中没有文档。</p>
          {documents.length > 0 && <p className="text-sm">请尝试更改搜索条件。</p>}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">名称</TableHead>
                <TableHead className="w-[20%]">上传时间</TableHead>
                <TableHead className="w-[15%]">大小</TableHead>
                <TableHead className="w-[15%]">状态</TableHead>
                <TableHead className="text-right w-[10%]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>{new Date(doc.uploaded_at).toLocaleString()}</TableCell>
                  <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  <TableCell>
                    {getStatusBadge(doc.status)}
                    {doc.status === "FAILED" && doc.error_message && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0" title="View Error">
                                    <Info className="h-4 w-4 text-red-500" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Document Processing Error: {doc.name}</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                    {doc.error_message}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button>Close</Button></DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={docToDelete?.id === doc.id} onOpenChange={(isOpen) => !isOpen && setDocToDelete(null)}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="删除文档" onClick={() => setDocToDelete(doc)}>
                                <Trash2 className="h-5 w-5 text-red-500" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>确认删除文档</DialogTitle>
                                <DialogDescription>
                                    您确定要删除文档 "{doc.name}" 吗？此操作无法撤销。
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDocToDelete(null)}>取消</Button>
                                <Button variant="destructive" onClick={handleDeleteDocument}>删除</Button>
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

