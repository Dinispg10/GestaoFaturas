import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceService } from '../features/invoices/invoiceService';
import { supplierService } from '../features/suppliers/supplierService';
import { Invoice, Supplier } from '../types';
import { supabaseUploadService } from '../utils/supabaseUploadService';
import { Button } from '../components/Button';
import { FileUpload } from '../components/FileUpload';
import { DateInputWithPicker } from '../components/DateInputWithPicker';
import { useAuthUser } from '../hooks/useUser';
import { formatDateOnlyForInput, parseDateOnly } from '../utils/dateUtils';


export const InvoiceFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthUser();

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    status: 'submitted',
    notes: '',
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [initialAttachment, setInitialAttachment] = useState<Invoice['attachment']>();
  const [invoiceDateInput, setInvoiceDateInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  
  const limitYearTo4Digits = (value: string) => {
    if (!value) return '';

    const [year = '', ...rest] = value.split('-');
    return [year.slice(0, 4), ...rest].join('-');
  };

  

  const handleDateChange = (field: 'invoiceDate' | 'dueDate', value: string) => {
    const normalizedValue = limitYearTo4Digits(value);
    const setInputValue = field === 'invoiceDate' ? setInvoiceDateInput : setDueDateInput;
    setInputValue(normalizedValue);

    if (normalizedValue === '') {
      setInvoice((prevInvoice) => ({ ...prevInvoice, [field]: undefined }));
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
      return;
    }

    const parsedDate = parseDateOnly(normalizedValue);
    if (!parsedDate) {
      return;
    }

    setInvoice((prevInvoice) => ({ ...prevInvoice, [field]: parsedDate }));
  };

    const revokeAttachmentPreviewUrl = useCallback((attachment?: Partial<Invoice['attachment']>) => {
    if (attachment?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supplierList = await supplierService.getActiveSuppliers();
      setSuppliers(supplierList);

      if (id) {
        const invoiceData = await invoiceService.getInvoice(id);
        if (invoiceData) {
          setInvoice(invoiceData);
          setInvoiceDateInput(formatDateOnlyForInput(invoiceData.invoiceDate));
          setDueDateInput(formatDateOnlyForInput(invoiceData.dueDate));
          setInitialAttachment(invoiceData.attachment);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const checkForDuplicate = async () => {
    if (invoice.supplierId && invoice.invoiceNumber) {
      const isDuplicate = await invoiceService.checkDuplicateInvoice(
        invoice.supplierId,
        invoice.invoiceNumber,
        id,
      );
      setShowDuplicateWarning(isDuplicate);
      return !isDuplicate;
    }
    return true;
  };

  const handleSubmit = async () => {
    const validationErrors: string[] = [];

    if (!invoice.supplierId) validationErrors.push('Fornecedor é obrigatório');
    if (!invoice.invoiceNumber) validationErrors.push('Nº de Fatura é obrigatório');
    if (!invoice.invoiceDate) validationErrors.push('Data da Fatura é obrigatória');
    if (!invoice.totalAmount && invoice.totalAmount !== 0) validationErrors.push('Total é obrigatório');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!(await checkForDuplicate())) {
      validationErrors.push('Já existe uma fatura com este número para este fornecedor');
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const supplier = suppliers.find((s) => s.id === invoice.supplierId);

      const invoiceData: Omit<Partial<Invoice>, 'attachment'> & { attachment?: Invoice['attachment'] | null } = {
        ...invoice,
        status: invoice.status === 'paid' ? 'paid' : 'submitted',
        supplierNameSnapshot: supplier?.name || '',
        createdBy: invoice.createdBy || user?.id || '',
      };

      if (id) {
        const attachmentWasRemoved = !invoice.attachment && Boolean(initialAttachment);
        
        if (invoice.attachment && invoice.attachment.file) {
          try {
            const uploaded = await supabaseUploadService.uploadInvoiceAttachment(invoice.attachment.file, id);
            invoiceData.attachment = {
              url: uploaded.url,
              fileName: uploaded.fileName,
              storagePath: uploaded.storagePath,
            } as any;
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro no upload do documento';
            setErrors([message]);
            console.error('Upload error:', err);
            setLoading(false);
            return;
          }
        }

         if (attachmentWasRemoved) {
          invoiceData.attachment = null;
        }

        await invoiceService.updateInvoice(id, invoiceData, user?.id || '', 'UPDATED');

        navigate(`/faturas/${id}`);
      } else {
        const newId = await invoiceService.createInvoice(invoiceData as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>);

        // If a file was selected before creating, upload it now and patch the invoice
        if (invoice.attachment && invoice.attachment.file) {
          try {
            const uploaded = await supabaseUploadService.uploadInvoiceAttachment(invoice.attachment.file, newId);
            await invoiceService.updateInvoice(newId, {
               attachment: { url: uploaded.url, fileName: uploaded.fileName, storagePath: uploaded.storagePath } as any,
            }, user?.id || '');
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao anexar documento à fatura';
            setErrors([message]);
           console.error('Attachment update error:', err);
            setLoading(false);
            return;
          }
        }

        navigate(`/faturas/${newId}`);
      }
    } catch (error) {
      setErrors(['Erro ao guardar fatura']);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    return () => {
      revokeAttachmentPreviewUrl(invoice.attachment);
    };
  }, [invoice.attachment, revokeAttachmentPreviewUrl]);

  const canEdit = true;

   const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="form-container">
      <div className="flex-between mb-4">
        <h2 className="page-title">{id ? 'Editar Fatura' : 'Nova Fatura'}</h2>
         <Button type="button" variant="secondary" onClick={() => navigate('/faturas')}>
          Voltar
        </Button>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-error">
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {showDuplicateWarning && (
        <div className="alert alert-info">
          Já existe uma fatura com este número para este fornecedor. Verifique antes de submeter para pagamento.
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        onKeyDown={handleFormKeyDown}
      >
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="supplier">Fornecedor *</label>
            <select
              id="supplier"
              value={invoice.supplierId || ''}
              onChange={(e) => setInvoice({ ...invoice, supplierId: e.target.value })}
              disabled={!canEdit}
            >
              <option value="">Selecionar Fornecedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="invoiceNumber">Nº de Fatura *</label>
            <input
              id="invoiceNumber"
              type="text"
              value={invoice.invoiceNumber || ''}
              onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="invoiceDate">Data da Fatura *</label>
            <DateInputWithPicker
              id="invoiceDate"
              value={invoiceDateInput}
              onChange={(value) => handleDateChange('invoiceDate', value)}
              disabled={!canEdit}
              ariaLabel="Abrir calendário da data da fatura"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Data de Vencimento</label>
            <DateInputWithPicker
              id="dueDate"
              value={dueDateInput}
              onChange={(value) => handleDateChange('dueDate', value)}
              disabled={!canEdit}
              ariaLabel="Abrir calendário da data de vencimento"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="totalAmount">Total (€) *</label>
            <input
              id="totalAmount"
              type="number"
              step="0.01"
              value={invoice.totalAmount ?? ''}
              onChange={(e) => {
                const nextValue = e.target.value;
                setInvoice({
                  ...invoice,
                  totalAmount: nextValue === '' ? undefined : parseFloat(nextValue),
                });
              }}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="attachment">Documento (Ficheiro)</label>
          <FileUpload
             onFileSelected={(file) => {
              revokeAttachmentPreviewUrl(invoice.attachment);
              setInvoice({ ...invoice, attachment: file });
            }}
            onError={(error) => setErrors((prevErrors) => [...prevErrors, error])}
            disabled={!canEdit}
          />
          {invoice.attachment && (
            <div className="attachment-info">
               <span>{invoice.attachment.fileName}</span>
              {canEdit && (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    revokeAttachmentPreviewUrl(invoice.attachment);
                    setInvoice({ ...invoice, attachment: undefined });
                  }}
                >
                  Remover
                </button>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notas</label>
          <textarea
            id="notes"
            value={invoice.notes || ''}
            onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
            disabled={!canEdit}
            placeholder="Adicione notas sobre esta fatura..."
          />
        </div>

        <div className="form-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/faturas')}
          >
            Cancelar
          </Button>
          {canEdit && (
           <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              {id ? 'Guardar Alterações' : 'Submeter para Pagamento'}
            </Button>
          )}
        </div>
      </form>

      <style>{`
        .form-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-group input[type="number"]::-webkit-outer-spin-button,
        .form-group input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .form-group input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }

        .attachment-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          padding: 8px 12px;
          background-color: #e8f4f8;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .attachment-name {
          flex: 1;
          min-width: 0;
          word-break: break-word;
        }

        .link-button {
          border: none;
          background: transparent;
          color: #d32f2f;
          padding: 0;
          font-size: 14px;
          cursor: pointer;
          line-height: 1.2;
          font-weight: 700;
          margin-left: auto;
          white-space: nowrap;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 30px;
          justify-content: flex-end;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .alert-error {
          background-color: #ffebee;
          color: #d32f2f;
          border: 1px solid #f5a5a5;
        }

        .alert-error ul {
          margin: 0;
          padding-left: 20px;
        }

        .alert-info {
          background-color: #e3f2fd;
          color: #1976d2;
          border: 1px solid #90caf9;
        }
      `}</style>
    </div>
  );
};
