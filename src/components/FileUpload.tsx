import React, { useRef, useState } from 'react';
import { FileAttachment } from '../types';
import { supabaseUploadService } from '../utils/supabaseUploadService';

interface FileUploadProps {
  onFileSelected?: (file: FileAttachment) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelected, 
  onError, 
  disabled = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Validate file
      const result = supabaseUploadService.validateFile(file);
      if (!result.valid) {
        const errorMsg = result.error || 'Ficheiro inválido';
        onError?.(errorMsg);
        return;
      }

      // This is just for validation - actual upload happens in InvoiceFormPage
      // after invoice is created and has an ID. We pass the raw File so parent
      // can perform the Supabase upload when it has the invoice ID.
      onFileSelected?.({
        url: URL.createObjectURL(file),
        fileName: file.name,
        storagePath: '',
        file,
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao processar ficheiro';
      onError?.(errorMsg);
      console.error('File processing error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        disabled={disabled || uploading}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || uploading}
        className="btn btn-secondary"
      >
        {uploading ? 'Processando...' : 'Selecionar Ficheiro'}
      </button>

      <div className="file-upload-info">
        <p className="info-text">
          PDF, JPG, PNG ou WebP
        </p>
      </div>
    </div>
  );
};
