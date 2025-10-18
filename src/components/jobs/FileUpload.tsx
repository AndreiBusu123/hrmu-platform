'use client';

/**
 * FileUpload Component
 *
 * Reusable component for uploading photos and documents to Firebase Storage.
 * Supports drag-and-drop, file preview, progress tracking, and file management.
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  uploadJobPhoto,
  uploadJobDocument,
  formatFileSize,
  getFileIcon,
  isImage,
  UploadProgress,
} from '@/services/storage.service';
import { JobDocument } from '@/types';
import { Trash2, Upload, FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  jobId: string;
  userId: string;
  type: 'photo' | 'document';
  existingFiles?: JobDocument[];
  maxFiles?: number;
  onUploadComplete: (file: JobDocument) => void;
  onDelete: (fileId: string) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export function FileUpload({
  jobId,
  userId,
  type,
  existingFiles = [],
  maxFiles = 20,
  onUploadComplete,
  onDelete,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUploadMore = existingFiles.length + uploadingFiles.length < maxFiles;

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!canUploadMore) {
      alert(`Maximum ${maxFiles} ${type}s allowed`);
      return;
    }

    const remainingSlots = maxFiles - existingFiles.length - uploadingFiles.length;
    const filesToUpload = files.slice(0, remainingSlots);

    // Add to uploading state
    const newUploadingFiles: UploadingFile[] = filesToUpload.map((file) => ({
      file,
      progress: 0,
    }));
    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Upload each file
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        const uploadFunc = type === 'photo' ? uploadJobPhoto : uploadJobDocument;

        const jobDoc = await uploadFunc(jobId, file, userId, (progress: UploadProgress) => {
          // Update progress
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.file === file ? { ...uf, progress: progress.progress } : uf
            )
          );
        });

        // Remove from uploading and add to existing
        setUploadingFiles((prev) => prev.filter((uf) => uf.file !== file));
        onUploadComplete(jobDoc);
      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === file ? { ...uf, error: error.message } : uf
          )
        );
      }
    }
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== file));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop {type}s here, or click to select
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {type === 'photo' ? 'Images up to 10MB' : 'Documents up to 50MB'} •{' '}
            {existingFiles.length}/{maxFiles} uploaded
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={
              type === 'photo'
                ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
                : '*'
            }
            multiple
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Select {type === 'photo' ? 'Photos' : 'Documents'}
          </Button>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading...</h4>
          {uploadingFiles.map((uf, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{uf.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(uf.file.size)}</p>
                    {uf.error ? (
                      <p className="text-xs text-red-500 mt-1">{uf.error}</p>
                    ) : (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uf.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(uf.progress)}%
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingFile(uf.file)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Uploaded {type === 'photo' ? 'Photos' : 'Documents'} ({existingFiles.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {existingFiles.map((file) => (
              <Card key={file.documentId} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Preview/Icon */}
                    <div className="flex-shrink-0">
                      {type === 'photo' && file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-2xl">
                          {getFileIcon(file.mimeType || '')}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {file.size ? formatFileSize(file.size) : 'Unknown size'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {file.uploadedAt
                          ? new Date(file.uploadedAt.toDate()).toLocaleDateString()
                          : 'Unknown date'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(file.documentId)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {existingFiles.length === 0 && uploadingFiles.length === 0 && !canUploadMore && (
        <div className="text-center py-8 text-gray-500">
          <p>No {type}s uploaded yet</p>
        </div>
      )}
    </div>
  );
}
