import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceService } from '../features/invoices/invoiceService';
import { supplierService } from '../features/suppliers/supplierService';
import { Invoice, InvoiceEvent, InvoiceStatus } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { supabaseUploadService } from '../utils/supabaseUploadService';
import { useAuthUser } from '../hooks/useUser';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthUser();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      console.log('[InvoiceDetailPage] Loading invoice:', id);
      setLoading(true);
      const invoiceData = await invoiceService.getInvoice(id);
      console.log('[InvoiceDetailPage] Got invoice:', !!invoiceData);
      if (invoiceData) {
        setInvoice(invoiceData);
        await supplierService.getSupplier(invoiceData.supplierId);
      }

      const eventsData = await invoiceService.getInvoiceEvents(id);
      console.log('[InvoiceDetailPage] Got events:', eventsData.length);
      setEvents(eventsData);
    } catch (error) {
      console.error('[InvoiceDetailPage] Error loading:', error);
    } finally {
      setLoading(false);
      console.log('[InvoiceDetailPage] setLoading(false)');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id || !user?.id || !paymentMethod) return;

    try {
      await invoiceService.markAsPaid(id, paymentMethod, user.id);
      setShowPaymentModal(false);
      setPaymentMethod('');
      loadData();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };


  const handleDownloadAttachment = async () => {
    if (!invoice?.attachment) return;

    try {
      const downloadUrl = await supabaseUploadService.getDownloadUrl(invoice.attachment);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
    }
  };

   const canMarkAsPaid = invoice?.status === 'submitted';

  const statusMap: Record<InvoiceStatus, string> = {
    submitted: 'Submetida para Pagamento',
    paid: 'Paga',
  };

  const eventTypeMap: Record<string, string> = {
    CREATED: 'Criada',
    SUBMITTED: 'Submetida para Pagamento',
    PAID: 'Marcada como Paga',
    UPDATED: 'Atualizada',
  };

  if (loading) {
    return <div className="text-center">Carregando...</div>;
  }

  if (!invoice) {
    return <div className="text-center">Fatura não encontrada</div>;
  }

  return (
    <div className="detail-container">
      <div className="flex-between mb-4">
        <h2 className="page-title">Fatura #{invoice.invoiceNumber}</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/faturas')}>
            Voltar
          </Button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Informações da Fatura</h3>
          <div className="detail-row">
            <span className="label">Estado:</span>
            <span className={`badge badge-${invoice.status}`}>{statusMap[invoice.status]}</span>
          </div>
          <div className="detail-row">
            <span className="label">Fornecedor:</span>
            <span>{invoice.supplierNameSnapshot}</span>
          </div>
          <div className="detail-row">
            <span className="label">Criado por:</span>
            <span>{invoice.createdBy}</span>
          </div>
          <div className="detail-row">
            <span className="label">Data:</span>
            <span>{new Date(invoice.invoiceDate).toLocaleDateString('pt-PT')}</span>
          </div>
          <div className="detail-row">
            <span className="label">Vencimento:</span>
            <span>{new Date(invoice.dueDate).toLocaleDateString('pt-PT')}</span>
          </div>
          <div className="detail-row">
            <span className="label">Total:</span>
            <span className="total-gross">
              {invoice.totalAmount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>

        <div className="detail-card">
          <h3>Documento</h3>
          {invoice.attachment ? (
            <div className="attachment-section">
              <p className="attachment-name">📎 {invoice.attachment.fileName}</p>
              <Button
                variant="primary"
                onClick={() => void handleDownloadAttachment()}
              >
                📥 Descarregar
              </Button>
            </div>
          ) : (
            <p className="text-muted">Sem documento anexado</p>
          )}
        </div>

        {invoice.notes && (
          <div className="detail-card">
            <h3>Notas</h3>
            <p>{invoice.notes}</p>
          </div>
        )}

        

        {invoice.payment && (
          <div className="detail-card">
            <h3>Pagamento</h3>
            <div className="detail-row">
              <span className="label">Método:</span>
              <span>{invoice.payment.method}</span>
            </div>
            <div className="detail-row">
              <span className="label">Valor Pago:</span>
              <span>{invoice.payment.amountPaid.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
            </div>
            <div className="detail-row">
              <span className="label">Data:</span>
              <span>{new Date(invoice.payment.paidAt).toLocaleDateString('pt-PT')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="actions-section">
        {canMarkAsPaid && (
          <Button variant="success" onClick={() => setShowPaymentModal(true)}>
            💳 Marcar como Paga
          </Button>
        )}
      </div>

      <div className="events-section">
        <h3>Histórico de Eventos</h3>
        {events.length > 0 ? (
          <div className="events-list">
            {events.map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-time">
                  {new Date(event.at).toLocaleDateString('pt-PT')}
                  <br />
                  {new Date(event.at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="event-content">
                  <p className="event-type">{eventTypeMap[event.type]}</p>
                  <p className="event-by">por {event.by}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">Sem eventos registados</p>
        )}
      </div>

      {/* Modals */}
      

      <Modal
        isOpen={showPaymentModal}
        title="Marcar como Paga"
        onClose={() => setShowPaymentModal(false)}
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button variant="success" onClick={handleMarkAsPaid} disabled={!paymentMethod}>
              Confirmar Pagamento
            </Button>
          </div>
        }
      >
        <div className="form-group">
          <label htmlFor="method">Método de Pagamento *</label>
          <select
            id="method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Selecionar</option>
            <option value="Transferência Bancária">Transferência Bancária</option>
            <option value="Cheque">Cheque</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão">Cartão</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
       <p className="text-muted">
          O valor pago será automaticamente o total da fatura.
        </p>
      </Modal>

      <style>{`
        .detail-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .flex {
          display: flex;
        }

        .gap-3 {
          gap: 12px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .detail-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
        }

        .detail-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f5f5f5;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-row .label {
          font-weight: 500;
          color: #666;
        }

        .total-gross {
          font-size: 18px;
          font-weight: 600;
          color: #0066cc;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-submitted {
          background-color: #f8d7da;
          color: #721c24;
        }

        .badge-approved {
          background-color: #d4edda;
          color: #155724;
        }

        .badge-rejected {
          background-color: #f8d7da;
          color: #721c24;
        }

        .badge-paid {
          background-color: #d4edda;
          color: #155724;
        }

        .attachment-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .attachment-name {
          font-weight: 500;
          word-break: break-all;
        }

        .text-muted {
          color: #999;
          font-size: 14px;
        }

        .actions-section {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .events-section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
        }

        .events-section h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f5f5f5;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-item {
          display: flex;
          gap: 16px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 4px;
          border-left: 4px solid #0066cc;
        }

        .event-time {
          font-size: 12px;
          color: #666;
          min-width: 80px;
          font-weight: 500;
        }

        .event-content {
          flex: 1;
        }

        .event-type {
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #0066cc;
        }

        .event-by {
          font-size: 12px;
          color: #999;
          margin: 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .mb-4 {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};
