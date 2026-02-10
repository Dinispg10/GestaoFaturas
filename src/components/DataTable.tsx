import React from 'react';
import './styles.css';

interface DataTableProps<T> {
  columns: {
    key: keyof T;
    label: string;
    render?: (value: unknown, row: T) => React.ReactNode;
  }[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  (
    {
      columns,
      data,
      onRowClick,
      loading = false,
      emptyMessage = 'Sem dados para mostrar',
    },
    ref
  ) => {
    if (loading) {
      return (
        <div className="data-table-loading">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return <div className="data-table-empty">{emptyMessage}</div>;
    }

    return (
      <div ref={ref} className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map((col) => (
                  <td key={String(col.key)}>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';
