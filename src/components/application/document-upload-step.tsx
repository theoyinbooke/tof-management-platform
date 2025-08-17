"use client";

import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Image, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadStepProps {
  form: UseFormReturn<any>;
  supportConfig?: any;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  storageId?: string;
  uploading?: boolean;
  progress?: number;
}


export function DocumentUploadStep({ form, supportConfig }: DocumentUploadStepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Use dynamic document requirements from support config, fallback to static if not available
  const documentTypes = supportConfig?.requiredDocuments?.map((doc: any) => ({
    id: doc.documentType,
    label: doc.displayName,
    description: doc.description || `Upload your ${doc.displayName.toLowerCase()}`,
    required: doc.isMandatory,
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024, // 5MB
    validityPeriod: doc.validityPeriod,
  })) || [
    // Fallback static documents if no support config
    {
      id: "passport_photo",
      label: "Passport Photograph",
      description: "Recent passport-size photograph",
      required: true,
      accept: "image/*",
      maxSize: 2 * 1024 * 1024, // 2MB
    },
    {
      id: "application_form",
      label: "Application Form",
      description: "Completed application form",
      required: true,
      accept: ".pdf,.jpg,.jpeg,.png",
      maxSize: 5 * 1024 * 1024, // 5MB
    },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File, docType: typeof documentTypes[0]) => {
    // Check file size
    if (file.size > docType.maxSize) {
      return `File size exceeds ${formatFileSize(docType.maxSize)} limit`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = docType.accept.split(',').map(type => type.trim());
    
    const isValidType = acceptedTypes.some(acceptedType => {
      if (acceptedType.startsWith('.')) {
        return fileExtension === acceptedType;
      }
      return file.type.startsWith(acceptedType.replace('*', ''));
    });

    if (!isValidType) {
      return `File type not supported. Accepted types: ${docType.accept}`;
    }

    return null;
  };

  const handleFileUpload = async (files: FileList, documentTypeId: string) => {
    const docType = documentTypes.find(dt => dt.id === documentTypeId);
    if (!docType) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${documentTypeId}-${Date.now()}-${i}`;
      
      // Validate file
      const validationError = validateFile(file, docType);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploading: true,
        progress: 0,
      };

      newFiles.push(uploadedFile);
    }

    // Update state with new files
    setUploadedFiles(prev => ({
      ...prev,
      [documentTypeId]: [...(prev[documentTypeId] || []), ...newFiles]
    }));

    // Upload each file
    for (let i = 0; i < newFiles.length; i++) {
      const uploadedFile = newFiles[i];
      const file = files[i];

      try {
        // Generate upload URL
        const postUrl = await generateUploadUrl();
        
        // Upload file with progress tracking
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadedFiles(prev => ({
              ...prev,
              [documentTypeId]: prev[documentTypeId]?.map(f => 
                f.id === uploadedFile.id ? { ...f, progress } : f
              ) || []
            }));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            setUploadedFiles(prev => ({
              ...prev,
              [documentTypeId]: prev[documentTypeId]?.map(f => 
                f.id === uploadedFile.id 
                  ? { ...f, uploading: false, storageId: response.storageId, progress: 100 }
                  : f
              ) || []
            }));
            toast.success(`${file.name} uploaded successfully`);
          } else {
            throw new Error(`Upload failed with status ${xhr.status}`);
          }
        };

        xhr.onerror = () => {
          throw new Error('Upload failed');
        };

        xhr.open('POST', postUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);

      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => ({
          ...prev,
          [documentTypeId]: prev[documentTypeId]?.filter(f => f.id !== uploadedFile.id) || []
        }));
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const removeFile = (documentTypeId: string, fileId: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [documentTypeId]: prev[documentTypeId]?.filter(f => f.id !== fileId) || []
    }));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getRequiredDocsStatus = () => {
    const requiredDocs = documentTypes.filter(dt => dt.required);
    const uploadedRequiredDocs = requiredDocs.filter(dt => 
      uploadedFiles[dt.id]?.some(f => f.storageId && !f.uploading)
    );
    return {
      uploaded: uploadedRequiredDocs.length,
      total: requiredDocs.length,
      isComplete: uploadedRequiredDocs.length === requiredDocs.length
    };
  };

  const requiredStatus = getRequiredDocsStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Document Upload</h4>
            <p className="text-sm text-blue-800">
              Please upload the required documents to complete your application. All files should be 
              clear, readable, and in the specified formats. You can upload multiple files for each document type.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Required Documents</span>
              <span className="text-sm text-gray-600">
                {requiredStatus.uploaded} of {requiredStatus.total} completed
              </span>
            </div>
            <Progress 
              value={(requiredStatus.uploaded / requiredStatus.total) * 100}
              className="h-2"
            />
            {requiredStatus.isComplete ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">All required documents uploaded</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {requiredStatus.total - requiredStatus.uploaded} required document(s) remaining
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Sections */}
      {documentTypes.map((docType) => {
        const files = uploadedFiles[docType.id] || [];
        const hasFiles = files.length > 0;
        
        return (
          <Card key={docType.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {docType.label}
                  {docType.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </CardTitle>
                {hasFiles && (
                  <Badge variant="outline" className="text-xs">
                    {files.length} file{files.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{docType.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Max file size: {formatFileSize(docType.maxSize)} | 
                  Formats: {docType.accept}
                </p>
                <input
                  type="file"
                  accept={docType.accept}
                  multiple={docType.id === 'additional_docs'}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files, docType.id)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm" className="pointer-events-none">
                  Choose Files
                </Button>
              </div>

              {/* Uploaded Files */}
              {hasFiles && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        {file.uploading && (
                          <div className="mt-1">
                            <Progress value={file.progress || 0} className="h-1" />
                            <p className="text-xs text-gray-500 mt-1">
                              Uploading... {file.progress || 0}%
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {file.storageId && !file.uploading ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : file.uploading ? (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(docType.id, file.id)}
                        className="flex-shrink-0 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">📸 Photo Requirements</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Recent passport-size photograph</li>
                <li>• Clear, well-lit image</li>
                <li>• Plain background preferred</li>
                <li>• Face clearly visible</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">📄 Document Quality</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Scan or photo documents clearly</li>
                <li>• Ensure all text is readable</li>
                <li>• Avoid blurry or dark images</li>
                <li>• Include all relevant pages</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden form field to track uploads */}
      <FormField
        control={form.control}
        name="documents"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <input
                type="hidden"
                value={JSON.stringify(uploadedFiles)}
                onChange={() => field.onChange(uploadedFiles)}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}