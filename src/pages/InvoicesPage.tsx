import React, { useMemo, useState, useEffect } from 'react';
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
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'submitted', label: 'Submetida' },
    { value: 'paid', label: 'Paga' },
  ];

  const supplierOptions = useMemo(() => {
    const supplierMap = new Map<string, string>();

    invoices.forEach((invoice) => {
      supplierMap.set(invoice.supplierId, invoice.supplierNameSnapshot);
    });

    return Array.from(supplierMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-PT'));
  }, [invoices]);

  const filterConfig = [
    { key: 'supplierId', label: 'Fornecedor', type: 'select' as const, options: supplierOptions },
    { key: 'status', label: 'Estado', type: 'select' as const, options: statusOptions },
    { key: 'search', label: 'Pesquisar', type: 'text' as const, placeholder: 'Nº Fatura ou Fornecedor' },
  ];

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      console.log('[InvoicesPage] Starting loadInvoices...');
      setLoading(true);
      const data = await invoiceService.getAllInvoices();
      console.log('[InvoicesPage] Got invoices:', data.length);
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error('[InvoicesPage] Error loading invoices:', error);
    } finally {
      setLoading(false);
      console.log('[InvoicesPage] setLoading(false)');
    }
  };

  const applyFilters = (newFilters: Record<string, string>) => {
    let result = invoices;

     if (newFilters.supplierId) {
      result = result.filter((inv) => inv.supplierId === newFilters.supplierId);
    }

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

    setActiveFilters(newFilters);
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

  const escapeCsv = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  };

  const handleExportCsv = () => {
    if (filteredInvoices.length === 0) {
      window.alert('Não há faturas para exportar com os filtros atuais.');
      return;
    }

    const headers = [
      'Fornecedor',
      'Numero Fatura',
      'Data Fatura',
      'Data Vencimento',
      'Estado',
      'Total',
      'Criado Por',
      'Atualizado Em',
    ];

    const rows = filteredInvoices.map((invoice) => [
      escapeCsv(invoice.supplierNameSnapshot),
      escapeCsv(invoice.invoiceNumber),
      formatDate(invoice.invoiceDate),
      formatDate(invoice.dueDate),
      invoice.status,
      invoice.totalAmount.toFixed(2),
      escapeCsv(invoice.createdBy),
      formatDate(invoice.updatedAt),
    ]);

    const content = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const supplierName = filteredInvoices[0].supplierNameSnapshot;
    const fileName = activeFilters.supplierId
      ? `faturas_${supplierName.replace(/\s+/g, '_').toLowerCase()}.csv`
      : 'faturas_todos_fornecedores.csv';

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={handleExportCsv}>
            Exportar CSV por fornecedor
          </Button>
          <Button variant="primary" onClick={() => navigate('/faturas/nova')}>
            + Nova Fatura
          </Button>
        </div>
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
