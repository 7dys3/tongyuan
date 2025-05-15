
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, UploadCloud } from 'lucide-react';
import apiService from '@/services/apiService'; // Import apiService

interface UploadedFileStatus {
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  message?: string; // Added for success message
}

export default function UploadPage() {
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadedFileStatus[]>([]);
  const [overallError, setOverallError] = useState<string | null>(null);
  const [knowledgeBaseId, _setKnowledgeBaseId] = useState<string>("default_kb"); // Example KB ID, make this dynamic later

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFilesToUpload(prevFiles => [...prevFiles, ...acceptedFiles]);
    const newFileStatuses = acceptedFiles.map(file => ({ name: file.name, status: 'pending' as 'pending' }));
    setUploadStatus(prevStatus => [...prevStatus, ...newFileStatuses]);
    setOverallError(null); // Clear previous overall errors
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md'],
    }
  });

  const handleUpload = async () => {
    if (filesToUpload.length === 0) {
      setOverallError("请先选择要上传的文件。");
      return;
    }
    setOverallError(null);

    setUploadStatus(prevStatus => 
        prevStatus.map(fileStat => 
            filesToUpload.find(f => f.name === fileStat.name && fileStat.status === 'pending') 
            ? { ...fileStat, status: 'uploading', progress: 0, error: undefined } 
            : fileStat
        )
    );

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      // Find the correct index in uploadStatus for the current file being processed
      // This is important because uploadStatus might contain statuses for files not in the current batch
      const fileIndexInStatus = uploadStatus.findIndex(s => s.name === file.name && s.status === 'uploading');
      
      if (fileIndexInStatus === -1) continue; 

      const formData = new FormData();
      formData.append('file', file);
      // formData.append('knowledge_base_id', knowledgeBaseId); // If API expects KB ID in form data

      try {
        // Use apiService for the upload
        // The URL will be relative to the baseURL configured in apiService
        const response = await apiService.post(`/knowledgebases/${knowledgeBaseId}/documents/upload`, formData, {
          // Axios onUploadProgress for file upload progress
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadStatus(prevStatus =>
                prevStatus.map((s, idx) =>
                  idx === fileIndexInStatus ? { ...s, progress: percentCompleted } : s
                )
              );
            }
          },
          headers: {
            // Axios will automatically set Content-Type to multipart/form-data when FormData is used.
            // Remove manual Content-Type if it was set before for fetch.
          }
        });

        const result = response.data; // Axios wraps response in data object
        setUploadStatus(prevStatus =>
          prevStatus.map((s, idx) =>
            idx === fileIndexInStatus ? { ...s, status: 'success', message: result.message || '上传成功', progress: 100 } : s
          )
        );

      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || '上传时发生未知错误。';
        setUploadStatus(prevStatus =>
          prevStatus.map((s, idx) =>
            idx === fileIndexInStatus ? { ...s, status: 'error', error: errorMessage, progress: s.progress } : s // Keep progress if error occurs mid-upload
          )
        );
      }
    }
    // Filter out successfully uploaded files from the selection list
    setFilesToUpload(prevFiles => prevFiles.filter(f => {
        const statusEntry = uploadStatus.find(s => s.name === f.name);
        return statusEntry?.status !== 'success';
    }));
  };

  const removeFile = (fileName: string) => {
    setFilesToUpload(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setUploadStatus(prevStatus => prevStatus.filter(status => status.name !== fileName));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">上传文档到知识库</CardTitle>
          <CardDescription>
            选择或拖拽文件到下方区域进行上传。支持 .txt, .pdf, .doc, .docx, .md 文件。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer 
                        ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            {isDragActive ? (
              <p className="text-gray-600 dark:text-gray-300">将文件拖放到此处...</p>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">将文件拖放到此处，或点击选择文件</p>
            )}
          </div>

          {filesToUpload.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">待上传文件:</h3>
              <ul className="space-y-1 list-disc list-inside">
                {filesToUpload.map((file, index) => (
                  <li key={index} className="text-sm flex justify-between items-center">
                    <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(file.name)} disabled={uploadStatus.find(s=>s.name === file.name)?.status === 'uploading'}>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overallError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{overallError}</AlertDescription>
            </Alert>
          )}

          {uploadStatus.filter(s => s.status !== 'pending' || filesToUpload.find(f=>f.name === s.name)).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">上传状态:</h3>
              {uploadStatus.map((fileStat, index) => 
                (filesToUpload.find(f => f.name === fileStat.name) || fileStat.status !== 'pending') && (
                <div key={index} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium truncate max-w-[70%]">{fileStat.name}</span>
                    {fileStat.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {fileStat.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                    {fileStat.status === 'uploading' && <span className="text-xs text-blue-500">上传中...</span>}
                  </div>
                  {fileStat.status === 'uploading' && fileStat.progress !== undefined && (
                    <Progress value={fileStat.progress} className="h-2" />
                  )}
                  {fileStat.status === 'error' && fileStat.error && (
                    <p className="text-xs text-red-500 mt-1">{fileStat.error}</p>
                  )}
                   {fileStat.status === 'success' && fileStat.message && (
                    <p className="text-xs text-green-500 mt-1">{fileStat.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleUpload} disabled={filesToUpload.length === 0 || uploadStatus.some(s => s.status === 'uploading')}>
            开始上传
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

