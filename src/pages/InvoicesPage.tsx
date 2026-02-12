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
  const [sortBy, setSortBy] = useState<keyof Invoice | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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

  const filterConfig = [
    { key: 'supplierId', label: 'Fornecedor', type: 'select' as const, options: supplierOptions },
    { key: 'status', label: 'Estado', type: 'select' as const, options: statusOptions },
    { key: 'dateFrom', label: 'Data inicial', type: 'date' as const },
    { key: 'dateTo', label: 'Data final', type: 'date' as const },
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

   const isValidDateFilter = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

  const parseDateFilter = (value: string) => {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };


  const applyFilters = (newFilters: Record<string, string>) => {
    let result = invoices;

     if (newFilters.supplierId) {
      result = result.filter((inv) => inv.supplierId === newFilters.supplierId);
    }

    if (newFilters.status) {
      result = result.filter((inv) => inv.status === newFilters.status);
    }

    if (isValidDateFilter(newFilters.dateFrom)) {
      const fromDate = parseDateFilter(newFilters.dateFrom);

      if (fromDate) {
        fromDate.setHours(0, 0, 0, 0);
        result = result.filter((inv) => {
          const invoiceDate = new Date(inv.invoiceDate);
          return invoiceDate >= fromDate;
        });
      }
    }
if (isValidDateFilter(newFilters.dateTo)) {
      const toDate = parseDateFilter(newFilters.dateTo);

      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        result = result.filter((inv) => {
          const invoiceDate = new Date(inv.invoiceDate);
          return invoiceDate <= toDate;
        });
      }
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
    if (!sortBy) {
      return filteredInvoices;
    }

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
    if (sortBy !== columnKey) {
      setSortBy(columnKey);
      setSortDirection('asc');
      return;
    }

    if (sortDirection === 'asc') {
      setSortDirection('desc');
      return;
    }

    setSortBy(undefined);
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

  const formatDate = (date?: Date) => {
    if (!date) return '—';
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
   if (sortedInvoices.length === 0) {
      window.alert('Não há faturas para exportar com os filtros atuais.');
      return;
    }

    const tableRows = sortedInvoices
      .map(
        (invoice) => `
          <tr>
            <td>${invoice.supplierNameSnapshot}</td>
            <td>${invoice.invoiceNumber}</td>
            <td>${formatDate(invoice.invoiceDate)}</td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td class="status-cell">${getStatusLabel(invoice.status)}</td>
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
       isValidDateFilter(activeFilters.dateFrom) ? `Data inicial: ${formatDate(new Date(activeFilters.dateFrom as string))}` : null,
      isValidDateFilter(activeFilters.dateTo) ? `Data final: ${formatDate(new Date(activeFilters.dateTo as string))}` : null,
      activeFilters.search ? `Pesquisa: ${activeFilters.search}` : null,
    ]
       .filter(Boolean);

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
              margin: 0 0 16px;
              font-size: 28px;
              color: #2e1d4d;
              letter-spacing: 0.2px;
            }

            .report-wrapper {
              border: 1px solid #ddd8e8;
              border-radius: 14px;
              overflow: hidden;
              box-shadow: 0 8px 24px rgba(33, 24, 56, 0.08);
            }

            .report-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }

            .report-table thead {
              background: #f6f1ff;
            }

            .report-table th {
              padding: 12px;
              text-align: left;
              font-weight: 700;
              color: #4a3167;
              border-bottom: 1px solid #ddd8e8;
            }

            .report-table td {
              border-bottom: 1px solid #f0edf7;
              padding: 10px 12px;
              color: #231b2e;
              vertical-align: top;
            }

            .report-table tbody tr:last-child td {
              border-bottom: none;
            }

            .report-table th,
            .report-table td {
              border-right: 1px solid #f0edf7;
            }

            .report-table th:last-child,
            .report-table td:last-child {
              border-right: none;
            }

            .filters {
              margin-bottom: 16px;
              background: #dfd6ef;
              padding: 10px 12px;
              border-radius: 8px;
              border: 1px solid #d2c6e5;
              font-size: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
            }

            .filters-label {
              font-weight: 700;
              color: #34214f;
            }

            .filter-tag {
              background: #fff;
              border: 1px solid #d9cceb;
              border-radius: 999px;
              padding: 3px 10px;
              color: #4a3167;
              white-space: nowrap;
            }

            .filter-tag.empty {
              white-space: normal;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            @media print {
              body {
                 margin: 0;
              }

              .report-wrapper {
                border-radius: 0;
                box-shadow: none;
                overflow: visible;
                break-inside: auto;
              }

              .report-table {
                page-break-inside: auto;
              }

              .report-table thead {
                display: table-header-group;
              }
                .report-table tfoot {
                display: table-footer-group;
              }

              .report-table tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }

            @media screen {
              body {
                max-width: 1120px;
                margin: 24px auto;
              }
            }

            .report-table th:nth-child(1), .report-table td:nth-child(1) { width: 18%; }
            .report-table th:nth-child(2), .report-table td:nth-child(2) { width: 9%; }
            .report-table th:nth-child(3), .report-table td:nth-child(3) { width: 10%; }
            .report-table th:nth-child(4), .report-table td:nth-child(4) { width: 10%; }
            .report-table th:nth-child(5), .report-table td:nth-child(5) { width: 18%; }
            .report-table th:nth-child(6), .report-table td:nth-child(6) { width: 10%; }
            .report-table th:nth-child(7), .report-table td:nth-child(7) { width: 12%; }
            .report-table th:nth-child(8), .report-table td:nth-child(8) { width: 13%; }

            .report-table td:nth-child(2),
            .report-table td:nth-child(3),
            .report-table td:nth-child(4),
            .report-table td:nth-child(6),
            .report-table td:nth-child(8) {
              white-space: nowrap;
            }

            .report-table td:nth-child(6) {
              font-weight: 600;
            }

            .status-cell {
              font-weight: 600;
              color: #4a3167;
            }

            .report-table td:first-child {
              text-transform: uppercase;
            }

            .report-table tbody tr:nth-child(even) {
              background: #fcfafe;
            }

            .report-table tbody tr:hover {
              background: #f8f5ff;
            }

            .report-table-container {
              width: 100%;
              overflow: visible;
            }

            .status-cell {
              white-space: normal;
              line-height: 1.2;
            }

            .report-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }

            .report-subtitle {
              color: #555;
              font-size: 12px;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>Relatório de Faturas</h1>
            <p class="report-subtitle">Farmácia Pinto</p>
          </div>
          <div class="filters">
             <span class="filters-label">Filtros aplicados:</span>
            ${filtersSummary.length > 0
              ? filtersSummary.map((filter) => `<span class="filter-tag">${filter}</span>`).join('')
              : '<span class="filter-tag empty">Sem filtros</span>'}
          </div>

          <div class="report-wrapper">
            <div class="report-table-container">
              <table class="report-table">
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
            </div>
          </div>
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
          <h2 className="page-title">Faturas</h2>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button className="btn btn-export" variant="secondary" onClick={handleExportPdf}>
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
