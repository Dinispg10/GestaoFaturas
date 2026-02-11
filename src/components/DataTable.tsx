import React from 'react';
import './styles.css';

interface DataTableProps<T> {
  columns: {
    key: keyof T;
    label: string;
    render?: (value: unknown, row: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  (
    {
      columns,
      data,
      onRowClick,
      loading = false,
      emptyMessage = 'Sem dados para mostrar',
      sortBy,
      sortDirection = 'asc',
      onSort,
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
        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)}>{col.label}</th>
              ))}
              {columns.map((col) => {
                 const isSorted = sortBy === col.key;
 
                 return (
                   <th
                     key={String(col.key)}
                     className={col.sortable ? 'sortable-header' : undefined}
                     onClick={() => col.sortable && onSort?.(col.key)}
                     title={col.sortable ? 'Clique para ordenar' : undefined}
                   >
                     <span>{col.label}</span>
                     {col.sortable ? (
                       <span className={`sort-indicator ${isSorted ? 'active' : ''}`}>
                         {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                       </span>
                     ) : null}
                   </th>
                 );
               })}
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
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';
