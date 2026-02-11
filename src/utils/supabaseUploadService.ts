import { supabase } from '../lib/supabase';
import { FileAttachment } from '../types';

const DEFAULT_STORAGE_BUCKET = 'invoices';
const CONFIGURED_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;

const getBucketCandidates = (): string[] => {
  return Array.from(new Set([CONFIGURED_STORAGE_BUCKET, DEFAULT_STORAGE_BUCKET]));
};

const extractStoragePathFromUrl = (url?: string): string | null => {
  if (!url || url.startsWith('blob:')) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

const resolveStoragePath = (attachment?: Partial<FileAttachment>): string | null => {

  if (!attachment) {
    return null;
  }

  if (attachment.storagePath && !attachment.storagePath.includes('*')) {
    return attachment.storagePath;
  }

  return extractStoragePathFromUrl(attachment.url);
};

const isBucketNotFound = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const maybeMessage = 'message' in error ? String((error as { message: unknown }).message) : '';
  return maybeMessage.toLowerCase().includes('bucket not found');
};

const sanitizeFileName = (fileName: string): string => {
  const cleaned = fileName
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  return cleaned || `documento-${Date.now()}`;
};


const uploadWithFallbackBucket = async (storagePath: string, file: File): Promise<string> => {
  let bucketNotFoundCount = 0;

  for (const bucket of getBucketCandidates()) {
    const { error } = await supabase.storage.from(bucket).upload(storagePath, file, { upsert: false });

    if (!error) {
      return bucket;
    }

    if (isBucketNotFound(error)) {
      bucketNotFoundCount += 1;
      continue;
    }

    throw error;
  }

  if (bucketNotFoundCount > 0) {
    throw new Error(
      `Bucket de storage não encontrado (${CONFIGURED_STORAGE_BUCKET}). Verifique VITE_SUPABASE_STORAGE_BUCKET ou use o bucket '${DEFAULT_STORAGE_BUCKET}'.`,
    );
  }

  throw new Error('Falha no upload do ficheiro');
};

export const supabaseUploadService = {
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
     return { valid: false, error: 'Ficheiro muito grande (máx. 20MB)' };
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

   const storageFileName = sanitizeFileName(file.name);
   const storagePath = `invoices/${invoiceId}/${storageFileName}`;

    try {
      const bucket = await uploadWithFallbackBucket(storagePath, file);

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

      return {
        storagePath,
        url: data.publicUrl,
        fileName: storageFileName,
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      if (isBucketNotFound(error)) {
        throw new Error(`Bucket de storage não encontrado (${CONFIGURED_STORAGE_BUCKET}). Verifique VITE_SUPABASE_STORAGE_BUCKET.`);
      }
      throw new Error(error instanceof Error ? error.message : 'Falha no upload do ficheiro');
    }
  },

  async uploadPaymentProof(file: File, invoiceId: string): Promise<FileAttachment> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Ficheiro inválido');
    }

    const storageFileName = sanitizeFileName(file.name);
    const storagePath = `invoices/${invoiceId}/pagamento-${storageFileName}`;

    try {
      const bucket = await uploadWithFallbackBucket(storagePath, file);
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

      return {
        storagePath,
        url: data.publicUrl,
        fileName: `pagamento-${storageFileName}`,
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      if (isBucketNotFound(error)) {
        throw new Error(`Bucket de storage não encontrado (${CONFIGURED_STORAGE_BUCKET}). Verifique VITE_SUPABASE_STORAGE_BUCKET.`);
      }
      throw new Error(error instanceof Error ? error.message : 'Falha no upload do ficheiro');
    }
  },

  async getDownloadUrl(attachment: FileAttachment): Promise<string> {
    if (attachment.url.startsWith('blob:')) {
      return attachment.url;
    }

    const storagePath = resolveStoragePath(attachment);
    if (!storagePath) {
      return attachment.url;
    }

    for (const bucket of getBucketCandidates()) {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 60);
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }

      if (!isBucketNotFound(error)) {
        break;
      }
    }

    return attachment.url;
  },

  async deleteFile(storagePath: string): Promise<void> {
    for (const bucket of getBucketCandidates()) {
      try {
        const { error } = await supabase.storage.from(bucket).remove([storagePath]);
        if (!error || !isBucketNotFound(error)) {
          return;
        }
      } catch (error) {
        if (!isBucketNotFound(error)) {
          console.error('Erro ao deletar ficheiro:', error);
          return;
        }
      }
    }
  },
async deleteAttachment(attachment?: Partial<FileAttachment>): Promise<void> {
    const storagePath = resolveStoragePath(attachment);
    if (!storagePath) {
      return;
    }

    await this.deleteFile(storagePath);
  },
};