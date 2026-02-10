import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '../features/invoices/invoiceService';
import { Invoice, InvoiceStatus } from '../types';
import { DataTable } from '../components/DataTable';
import { FilterBar } from '../components/FilterBar';
import { Button } from '../components/Button';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'submitted', label: 'Submetida' },
    { value: 'paid', label: 'Paga' },
  ];

  const filterConfig = [
    { key: 'status', label: 'Estado', type: 'select' as const, options: statusOptions },
    { key: 'search', label: 'Pesquisar', type: 'text' as const, placeholder: 'Nº Fatura ou Fornecedor' },
  ];

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAllInvoices();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (newFilters: Record<string, string>) => {
    let result = invoices;

    if (newFilters.status) {
      result = result.filter((inv) => inv.status === newFilters.status);
    }

    if (newFilters.search) {
      const searchLower = newFilters.search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.supplierNameSnapshot.toLowerCase().includes(searchLower)
      );
    }

    setFilteredInvoices(result);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusMap: Record<InvoiceStatus, string> = {
      draft: 'Rascunho',
      submitted: 'Submetida',
      paid: 'Paga',
    };

    return (
      <span className={`badge badge-${status}`}>
        {statusMap[status]}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-PT');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  };

  const columns = [
    {
      key: 'supplierNameSnapshot' as const,
      label: 'Fornecedor',
    },
    {
      key: 'invoiceNumber' as const,
      label: 'Nº Fatura',
    },
    {
      key: 'invoiceDate' as const,
      label: 'Data',
      render: (value: unknown) => formatDate(value as Date),
    },
    {
      key: 'dueDate' as const,
      label: 'Vencimento',
      render: (value: unknown) => {
        const dueDate = new Date(value as Date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          return <span style={{ color: '#d32f2f', fontWeight: 600 }}>
            {formatDate(value as Date)} (Vencida)
          </span>;
        }
        return formatDate(value as Date);
      },
    },
    {
      key: 'totalAmount' as const,
      label: 'Total',
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: 'status' as const,
      label: 'Estado',
      render: (value: unknown) => getStatusBadge(value as InvoiceStatus),
    },
    {
      key: 'createdBy' as const,
      label: 'Criado por',
    },
    {
      key: 'updatedAt' as const,
      label: 'Atualizado em',
      render: (value: unknown) => formatDate(value as Date),
    },
  ];

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h2 className="page-title">Faturas de Compra</h2>
          <p className="page-subtitle">Total: {filteredInvoices.length} faturas</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/faturas/nova')}>
          + Nova Fatura
        </Button>
      </div>

      <FilterBar filters={filterConfig} onFilterChange={applyFilters} />

      <DataTable
        columns={columns}
        data={filteredInvoices}
        loading={loading}
        onRowClick={(invoice) => navigate(`/faturas/${invoice.id}`)}
        emptyMessage="Nenhuma fatura encontrada"
      />

      <style>{`
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .mb-4 {
          margin-bottom: 16px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .page-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
      `}</style>
    </div>
  );
};
