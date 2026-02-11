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
  const [sortBy, setSortBy] = useState<keyof Invoice>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'submitted', label: 'Submetida para Pagamento' },
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

   const monthYearOptions = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' });
    const uniqueMonths = new Set<string>();

    invoices.forEach((invoice) => {
      const date = new Date(invoice.invoiceDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      uniqueMonths.add(`${year}-${month}`);
    });

    return Array.from(uniqueMonths)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => {
        const [year, month] = value.split('-').map(Number);
        const labelDate = new Date(year, month - 1, 1);
        const label = monthFormatter.format(labelDate);
        return {
          value,
          label: label.charAt(0).toUpperCase() + label.slice(1),
        };
      });
  }, [invoices]);

  const filterConfig = [
    { key: 'supplierId', label: 'Fornecedor', type: 'select' as const, options: supplierOptions },
    { key: 'status', label: 'Estado', type: 'select' as const, options: statusOptions },
    { key: 'monthYear', label: 'Mês/Ano', type: 'select' as const, options: monthYearOptions },
    { key: 'search', label: 'Pesquisar', type: 'text' as const, placeholder: 'Nº Fatura' },
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

    if (newFilters.monthYear) {
      result = result.filter((inv) => {
        const date = new Date(inv.invoiceDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}` === newFilters.monthYear;
      });
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

  const sortedInvoices = useMemo(() => {
     const dateFields: Array<keyof Invoice> = ['invoiceDate', 'dueDate', 'updatedAt', 'createdAt'];
 
     const sorted = [...filteredInvoices].sort((a, b) => {
       const valueA = a[sortBy];
       const valueB = b[sortBy];
 
       if (valueA == null && valueB == null) {
         return 0;
       }
 
       if (valueA == null) {
         return sortDirection === 'asc' ? -1 : 1;
       }
 
       if (valueB == null) {
         return sortDirection === 'asc' ? 1 : -1;
       }
 
       if (dateFields.includes(sortBy)) {
         const dateA = new Date(valueA as string | number | Date).getTime();
         const dateB = new Date(valueB as string | number | Date).getTime();
         return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
       }
 
       if (typeof valueA === 'number' && typeof valueB === 'number') {
         return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
       }
 
       const textA = String(valueA).toLowerCase();
       const textB = String(valueB).toLowerCase();
       const compareResult = textA.localeCompare(textB, 'pt-PT');
 
       return sortDirection === 'asc' ? compareResult : -compareResult;
     });
 
     return sorted;
   }, [filteredInvoices, sortBy, sortDirection]);
 
   const handleSort = (columnKey: keyof Invoice) => {
     if (sortBy === columnKey) {
       setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
       return;
     }
 
     setSortBy(columnKey);
     setSortDirection('asc');
   };

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusMap: Record<InvoiceStatus, string> = {
      submitted: 'Submetida para Pagamento',
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

   const getStatusLabel = (status: InvoiceStatus) => {
    const statusMap: Record<InvoiceStatus, string> = {
      submitted: 'Submetida para Pagamento',
      paid: 'Paga',
    };

    return statusMap[status];
  };

  const handleExportPdf = () => {
    if (filteredInvoices.length === 0) {
      window.alert('Não há faturas para exportar com os filtros atuais.');
      return;
    }

    const tableRows = filteredInvoices
      .map(
        (invoice) => `
          <tr>
            <td>${invoice.supplierNameSnapshot}</td>
            <td>${invoice.invoiceNumber}</td>
            <td>${formatDate(invoice.invoiceDate)}</td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td>${getStatusLabel(invoice.status)}</td>
            <td>${formatCurrency(invoice.totalAmount)}</td>
            <td>${invoice.createdBy}</td>
            <td>${formatDate(invoice.updatedAt)}</td>
          </tr>
        `
      )
      .join('');

    const filtersSummary = [
      activeFilters.supplierId
        ? `Fornecedor: ${supplierOptions.find((opt) => opt.value === activeFilters.supplierId)?.label ?? 'N/A'}`
        : null,
      activeFilters.status
        ? `Estado: ${statusOptions.find((opt) => opt.value === activeFilters.status)?.label ?? 'N/A'}`
        : null,
      activeFilters.monthYear
        ? `Mês/Ano: ${monthYearOptions.find((opt) => opt.value === activeFilters.monthYear)?.label ?? activeFilters.monthYear}`
        : null,
      activeFilters.search ? `Pesquisa: ${activeFilters.search}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    
    const reportDate = new Date().toLocaleString('pt-PT');

    const htmlContent = `
      <!doctype html>
      <html lang="pt">
        <head>
          <meta charset="UTF-8" />
          <title>Relatório de faturas</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 24px;
              color: #1f1f1f;
            }

            h1 {
              margin: 0 0 8px;
              font-size: 22px;
            }

            .meta {
              margin-bottom: 8px;
              color: #555;
              font-size: 12px;
            }

            .filters {
              margin-bottom: 16px;
              background: #f7f7f9;
              padding: 10px 12px;
              border-radius: 8px;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }

            th, td {
              border: 1px solid #d6d6de;
              padding: 8px;
              text-align: left;
            }

            th {
              background: #f0ebfa;
            }

            @media print {
              body {
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Faturas</h1>
          <div class="meta">Gerado em: ${reportDate}</div>
          <div class="meta">Total de registos: ${filteredInvoices.length}</div>
          <div class="filters">
            <strong>Filtros aplicados:</strong> ${filtersSummary || 'Sem filtros'}
          </div>

          <table>
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Nº Fatura</th>
                <th>Data</th>
                <th>Vencimento</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Criado por</th>
                <th>Atualizado em</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
      
      `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const printFrame = document.createElement('iframe');

    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.src = blobUrl;

    printFrame.onload = () => {
      const frameWindow = printFrame.contentWindow;

      if (!frameWindow) {
        window.alert('Não foi possível iniciar a impressão do relatório.');
        URL.revokeObjectURL(blobUrl);
        printFrame.remove();
        return;
      }

      frameWindow.focus();
      frameWindow.print();

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        printFrame.remove();
      }, 1000);
    };
document.body.appendChild(printFrame);
  };


  const columns = [
    {
      key: 'supplierNameSnapshot' as const,
      sortable: true,
      label: 'Fornecedor',
    },
    {
      key: 'invoiceNumber' as const,
      sortable: true,
      label: 'Nº Fatura',
    },
    {
      key: 'invoiceDate' as const,
      sortable: true,
      label: 'Data',
      render: (value: unknown) => formatDate(value as Date),
    },
    {
      key: 'dueDate' as const,
      sortable: true,
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
      sortable: true,
      label: 'Total',
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: 'status' as const,
      sortable: true,
      label: 'Estado',
      render: (value: unknown) => getStatusBadge(value as InvoiceStatus),
    },
    {
      key: 'createdBy' as const,
      sortable: true,
      label: 'Criado por',
    },
    {
      key: 'updatedAt' as const,
      sortable: true,
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
          <p className="page-subtitle">Total: {filteredInvoices.length} faturas · Clique no cabeçalho para ordenar</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={handleExportPdf}>
            Exportar PDF
          </Button>
          <Button variant="primary" onClick={() => navigate('/faturas/nova')}>
            + Nova Fatura
          </Button>
        </div>
      </div>

      <FilterBar filters={filterConfig} onFilterChange={applyFilters} />

      <DataTable
        columns={columns}
        data={sortedInvoices}
        loading={loading}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(key) => handleSort(key as keyof Invoice)}
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
