"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  File,
  FileText,
  Image,
  Video,
  X,
  Check,
  AlertCircle,
  Download,
} from "lucide-react";

interface FileUploadProps {
  onFileUploaded: (fileId: Id<"_storage">) => void;
  currentFileId?: Id<"_storage"> | null;
}

export function FileUpload({ onFileUploaded, currentFileId }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutation to generate upload URL
  const generateUploadUrl = useMutation(api.resources.generateUploadUrl);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'audio/mp3',
    'audio/wav',
    'audio/mpeg',
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload PDF, Office documents, images, videos, or audio files.`;
    }
    
    if (file.size > maxFileSize) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum limit of ${formatFileSize(maxFileSize)}.`;
    }
    
    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const fileId = response.storageId as Id<"_storage">;
          
          setUploadedFile({
            name: file.name,
            size: file.size,
            type: file.type,
          });
          
          onFileUploaded(fileId);
          toast.success("File uploaded successfully");
        } else {
          throw new Error(`Upload failed with status: ${xhr.status}`);
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setUploadError("Upload failed. Please try again.");
        setIsUploading(false);
      };

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload file. Please try again.");
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!uploadedFile && !currentFileId && (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragging
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-emerald-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Resource File
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                
                <Button variant="outline" className="mb-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                
                <div className="text-sm text-gray-500">
                  <p>Supported formats: PDF, Office documents, images, videos, audio</p>
                  <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
      />

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Error */}
      {uploadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{uploadError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadError(null)}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded File Display */}
      {(uploadedFile || currentFileId) && !isUploading && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                {uploadedFile ? (
                  React.createElement(getFileIcon(uploadedFile.type), {
                    className: "h-5 w-5 text-emerald-600"
                  })
                ) : (
                  <File className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    File uploaded successfully
                  </span>
                </div>
                {uploadedFile && (
                  <div className="text-sm text-emerald-600 mt-1">
                    {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearFile}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Type Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">File Upload Guidelines</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p className="font-medium mb-1">Documents:</p>
              <ul className="space-y-1">
                <li>• PDF files (.pdf)</li>
                <li>• Word documents (.doc, .docx)</li>
                <li>• PowerPoint (.ppt, .pptx)</li>
                <li>• Excel files (.xls, .xlsx)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Media:</p>
              <ul className="space-y-1">
                <li>• Images (.jpg, .png, .gif)</li>
                <li>• Videos (.mp4, .avi, .mov)</li>
                <li>• Audio (.mp3, .wav)</li>
                <li>• Text files (.txt)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}