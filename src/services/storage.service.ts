/**
 * Storage Service
 *
 * Handles all Firebase Storage operations for file uploads, downloads, and deletions.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
  StorageReference,
} from 'firebase/storage';
import { getFirebaseStorage } from '@/lib/firebase/client';
import { JobDocument } from '@/types';
import { Timestamp } from 'firebase/firestore';

export interface UploadProgress {
  progress: number;
  total: number;
  transferred: number;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file - File to upload
 * @param path - Storage path (e.g., 'jobs/JOB-001/photos/image.jpg')
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with download URL and metadata
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Progress callback
        if (onProgress) {
          const progress = {
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            total: snapshot.totalBytes,
            transferred: snapshot.bytesTransferred,
          };
          onProgress(progress);
        }
      },
      (error) => {
        // Error callback
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        // Success callback
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            path: path,
            size: file.size,
            mimeType: file.type,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload a job photo
 * @param jobId - Job ID
 * @param file - Photo file
 * @param onProgress - Optional progress callback
 * @returns Promise with JobDocument
 */
export async function uploadJobPhoto(
  jobId: string,
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<JobDocument> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images are allowed for photos.');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit.');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = `jobs/${jobId}/photos/${timestamp}_${sanitizedFileName}`;

  // Upload file
  const result = await uploadFile(file, path, onProgress);

  // Create JobDocument object
  const jobDocument: JobDocument = {
    documentId: `photo_${timestamp}`,
    name: file.name,
    url: result.url,
    storagePath: path,
    type: 'photo',
    uploadedBy: userId,
    uploadedAt: Timestamp.now(),
    size: result.size,
    mimeType: result.mimeType,
  };

  return jobDocument;
}

/**
 * Upload a job document
 * @param jobId - Job ID
 * @param file - Document file
 * @param onProgress - Optional progress callback
 * @returns Promise with JobDocument
 */
export async function uploadJobDocument(
  jobId: string,
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<JobDocument> {
  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 50MB limit.');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = `jobs/${jobId}/documents/${timestamp}_${sanitizedFileName}`;

  // Upload file
  const result = await uploadFile(file, path, onProgress);

  // Create JobDocument object
  const jobDocument: JobDocument = {
    documentId: `doc_${timestamp}`,
    name: file.name,
    url: result.url,
    storagePath: path,
    type: 'document',
    uploadedBy: userId,
    uploadedAt: Timestamp.now(),
    size: result.size,
    mimeType: result.mimeType,
  };

  return jobDocument;
}

/**
 * Delete a file from Firebase Storage
 * @param path - Storage path
 */
export async function deleteFile(path: string): Promise<void> {
  const storage = getFirebaseStorage();
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
}

/**
 * Delete a job photo or document
 * @param storagePath - Storage path of the file (e.g., 'jobs/JOB-001/photos/image.jpg')
 */
export async function deleteJobFile(storagePath: string): Promise<void> {
  const storage = getFirebaseStorage();
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 * @param filename - File name
 * @returns File extension (e.g., "pdf", "jpg")
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 * @param mimeType - MIME type
 * @returns True if image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Get icon for file type
 * @param mimeType - MIME type
 * @returns Icon name or emoji
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  return '📎';
}
