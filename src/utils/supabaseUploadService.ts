import { supabase } from '../lib/supabase';
import { FileAttachment } from '../types';

export const supabaseUploadService = {
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB (otimizado para storage)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return { valid: false, error: 'Ficheiro muito grande (máx 20MB)' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Tipo de ficheiro não permitido (PDF, JPG, PNG, WebP)' };
    }

    return { valid: true };
  },

  async uploadInvoiceAttachment(file: File, invoiceId: string): Promise<FileAttachment> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Ficheiro inválido');
    }

    const ext = file.name.split('.').pop() || 'bin';
    const storagePath = `invoices/${invoiceId}/original.${ext}`;

    try {
      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Gerar URL pública
      const { data } = supabase.storage
        .from('invoices')
        .getPublicUrl(storagePath);

      return {
        storagePath,
        url: data.publicUrl,
        fileName: file.name,
        size: file.size,
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      throw new Error('Falha no upload do ficheiro');
    }
  },

  async uploadPaymentProof(file: File, invoiceId: string): Promise<FileAttachment> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Ficheiro inválido');
    }

    const ext = file.name.split('.').pop() || 'bin';
    const storagePath = `invoices/${invoiceId}/proof.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('invoices')
        .getPublicUrl(storagePath);

      return {
        storagePath,
        url: data.publicUrl,
        fileName: file.name,
        size: file.size,
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      throw new Error('Falha no upload do ficheiro');
    }
  },

  async deleteFile(storagePath: string): Promise<void> {
    try {
      await supabase.storage.from('invoices').remove([storagePath]);
    } catch (error) {
      console.error('Erro ao deletar ficheiro:', error);
    }
  },
};
