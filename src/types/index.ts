export type UserRole = 'staff' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  active: boolean;
  created_at: Date;
}

export type InvoiceStatus = 'draft' | 'submitted' | 'paid';

export interface FileAttachment {
  url: string;
  fileName: string;
  size?: number;
  storagePath: string;
  file?: File;
}

export interface PaymentData {
  paidAt: Date;
  method: string;
  amountPaid: number;
}

export interface Invoice {
  id: string;
  supplierId: string;
  supplierNameSnapshot: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  status: InvoiceStatus;
  attachment?: FileAttachment;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  payment?: PaymentData;
}

export type InvoiceEventType = 'CREATED' | 'SUBMITTED' | 'PAID' | 'UPDATED';

export interface InvoiceEvent {
  id: string;
  invoiceId: string;
  type: InvoiceEventType;
  by: string;
  at: Date;
  details: Record<string, unknown>;
}
