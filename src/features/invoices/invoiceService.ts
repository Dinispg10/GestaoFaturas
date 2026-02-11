import { supabase } from '../../lib/supabase';
import { Invoice, InvoiceEvent, InvoiceStatus } from '../../types';
import { supabaseUploadService } from '../../utils/supabaseUploadService';

const INVOICE_SELECT = `
  *,
  created_by_user:users!invoices_created_by_fkey(name)
`;

const EVENT_SELECT = `
  *,
  by_user:users!invoice_events_by_user_id_fkey(name)
`;

const extractStoragePathFromAttachmentUrl = (attachmentUrl?: string): string => {
  if (!attachmentUrl) return '';

  try {
    const parsed = new URL(attachmentUrl);
    const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
};

const getFileNameFromAttachmentUrl = (attachmentUrl?: string): string => {
  if (!attachmentUrl) return 'documento';

  try {
    const parsed = new URL(attachmentUrl);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return lastPart ? decodeURIComponent(lastPart) : 'documento';
  } catch {
    const lastPart = attachmentUrl.split('/').pop();
    return lastPart ? decodeURIComponent(lastPart) : 'documento';
  }
};


export const invoiceService = {
  async createInvoice(
    invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        supplier_id: invoice.supplierId,
        supplier_name_snapshot: invoice.supplierNameSnapshot,
        invoice_number: invoice.invoiceNumber,
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate,
        total_amount: invoice.totalAmount,
        status: invoice.status,
        attachment_url: invoice.attachment?.url,
        notes: invoice.notes,
        created_by: invoice.createdBy,
      })
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Falha ao criar fatura');

    const newInvoiceId = data[0].id;

    // Log event
    await this.logEvent(newInvoiceId, 'CREATED', invoice.createdBy);

    return newInvoiceId;
  },

  async updateInvoice(
    invoiceId: string,
    invoice: Omit<Partial<Invoice>, 'attachment'> & { attachment?: Invoice['attachment'] | null },
    userId: string,
    eventType?: InvoiceEvent['type'],
  ): Promise<void> {
    const updateData: Record<string, any> = {};
    let existingAttachmentUrl: string | null = null;

    if (invoice.attachment !== undefined) {
      const { data: existingInvoice, error: existingInvoiceError } = await supabase
        .from('invoices')
        .select('attachment_url')
        .eq('id', invoiceId)
        .single();

      if (existingInvoiceError) throw existingInvoiceError;
      existingAttachmentUrl = existingInvoice?.attachment_url || null;
    }

    if (invoice.supplierNameSnapshot) updateData.supplier_name_snapshot = invoice.supplierNameSnapshot;
    if (invoice.invoiceNumber) updateData.invoice_number = invoice.invoiceNumber;
    if (invoice.invoiceDate) updateData.invoice_date = invoice.invoiceDate;
    if (invoice.dueDate) updateData.due_date = invoice.dueDate;
    if (invoice.totalAmount !== undefined) updateData.total_amount = invoice.totalAmount;
    if (invoice.status) updateData.status = invoice.status;
    if (invoice.attachment === null) {
      updateData.attachment_url = null;
    } else if (invoice.attachment) {
      updateData.attachment_url = invoice.attachment.url;
    }
    if (invoice.notes) updateData.notes = invoice.notes;
    if (invoice.payment) {
      updateData.payment_paid_at = invoice.payment.paidAt;
      updateData.payment_method = invoice.payment.method;
      updateData.payment_amount_paid = invoice.payment.amountPaid;
    }

    updateData.updated_at = new Date();

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (error) throw error;

    if (invoice.attachment !== undefined && existingAttachmentUrl) {
      const existingStoragePath = extractStoragePathFromAttachmentUrl(existingAttachmentUrl);
      const nextStoragePath = invoice.attachment ? invoice.attachment.storagePath || '' : '';
      const shouldDeletePreviousAttachment = invoice.attachment === null
        || (Boolean(nextStoragePath) && nextStoragePath !== existingStoragePath);

      if (shouldDeletePreviousAttachment) {
        await supabaseUploadService.deleteAttachment({
          url: existingAttachmentUrl,
          storagePath: existingStoragePath,
        });
      }
    }

    
   if (eventType) {
      await this.logEvent(invoiceId, eventType, userId);
    }
  },


  async deleteInvoice(invoiceId: string): Promise<void> {
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('attachment_url')
      .eq('id', invoiceId)
      .single();

    if (fetchError) throw fetchError;

    if (existingInvoice?.attachment_url) {
      await supabaseUploadService.deleteAttachment({
        url: existingInvoice.attachment_url,
        storagePath: extractStoragePathFromAttachmentUrl(existingInvoice.attachment_url),
      });
    }
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  },

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .eq('id', invoiceId)
      .single();

    if (error || !data) return null;
    return this.mapSupabaseToInvoice(data);
  },

  async getAllInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapSupabaseToInvoice);
  },

  async getInvoicesBySupplierId(supplierId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapSupabaseToInvoice);
  },

 async checkDuplicateInvoice(
    supplierId: string,
    invoiceNumber: string,
    excludeInvoiceId?: string,
  ): Promise<boolean> {
    let query = supabase
      .from('invoices')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('invoice_number', invoiceNumber);

    if (excludeInvoiceId) {
      query = query.neq('id', excludeInvoiceId);
    }

    const { data } = await query.limit(1);

    return Boolean(data?.length);
  },

  async markAsPaid(
    invoiceId: string,
    method: string,
    userId: string,
  ): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

     if (invoice.status !== 'submitted') {
      throw new Error('Apenas faturas submetidas para pagamento podem ser marcadas como pagas');
    }
    
    await this.updateInvoice(
      invoiceId,
      {
        status: 'paid' as InvoiceStatus,
        payment: {
          paidAt: new Date(),
          method,
          amountPaid: invoice.totalAmount,
        },
      },
      userId,
      'PAID',
    );
  },

  async submitInvoice(invoiceId: string, userId: string): Promise<void> {
    await this.updateInvoice(
      invoiceId,
      { status: 'submitted' as InvoiceStatus },
      userId,
      'SUBMITTED',
    );
  },

  async getInvoiceEvents(invoiceId: string): Promise<InvoiceEvent[]> {
    const { data, error } = await supabase
      .from('invoice_events')
      .select(EVENT_SELECT)
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((event: any) => ({
      id: event.id,
      invoiceId: event.invoice_id,
      type: event.type,
      by: event.by_user?.name || event.by_user_id,
      at: new Date(event.created_at),
      details: event.details || {},
    }));
  },

  validateInvoiceForSubmission(invoice: Partial<Invoice>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!invoice.supplierId) errors.push('Fornecedor é obrigatório');
    if (!invoice.invoiceNumber) errors.push('Nº de Fatura é obrigatório');
    if (!invoice.invoiceDate) errors.push('Data da Fatura é obrigatória');
    if (invoice.totalAmount === undefined || invoice.totalAmount === null) errors.push('Total é obrigatório');
    if (!invoice.attachment) errors.push('Documento é obrigatório');

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  mapSupabaseToInvoice(data: any): Invoice {
    return {
      id: data.id,
      supplierId: data.supplier_id,
      supplierNameSnapshot: data.supplier_name_snapshot,
      invoiceNumber: data.invoice_number,
      invoiceDate: new Date(data.invoice_date),
      dueDate: new Date(data.due_date),
      totalAmount: data.total_amount,
      status: data.status,
      attachment: data.attachment_url ? {
        url: data.attachment_url,
        fileName: getFileNameFromAttachmentUrl(data.attachment_url),
        storagePath: extractStoragePathFromAttachmentUrl(data.attachment_url),
      } : undefined,
      notes: data.notes,
      createdBy: data.created_by_user?.name || data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      payment: data.payment_paid_at ? {
        paidAt: new Date(data.payment_paid_at),
        method: data.payment_method,
        amountPaid: data.payment_amount_paid,
      } : undefined,
    };
  },

  async logEvent(invoiceId: string, type: InvoiceEvent['type'], userId: string): Promise<void> {
    await supabase.from('invoice_events').insert({
      invoice_id: invoiceId,
      type,
      by_user_id: userId,
      details: {},
    });
  },
};
