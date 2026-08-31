import React from 'react';
import './styles.css';

interface DataTableProps<T> {
  columns: {
    key: keyof T;
    label: string;
    render?: (value: unknown, row: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
  }[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  isRowSelectable?: (row: T) => boolean;
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
      selectable = false,
      selectedIds = new Set(),
      onSelectionChange,
      isRowSelectable,
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

    const selectableRows = selectable
      ? data.filter((row) => !isRowSelectable || isRowSelectable(row))
      : [];

    const allSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.has(row.id));
    const someSelected = selectableRows.some((row) => selectedIds.has(row.id));

    const toggleAll = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onSelectionChange) return;
      if (allSelected) {
        const next = new Set(selectedIds);
        selectableRows.forEach((row) => next.delete(row.id));
        onSelectionChange(next);
      } else {
        const next = new Set(selectedIds);
        selectableRows.forEach((row) => next.add(row.id));
        onSelectionChange(next);
      }
    };

    const toggleRow = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!onSelectionChange) return;
      const next = new Set(selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      onSelectionChange(next);
    };

    const handleRowClick = (row: any) => {
      if (selectable) {
        const canSelect = !isRowSelectable || isRowSelectable(row);
        if (canSelect && onSelectionChange) {
          const next = new Set(selectedIds);
          next.has(row.id) ? next.delete(row.id) : next.add(row.id);
          onSelectionChange(next);
        }
        return;
      }
      onRowClick?.(row);
    };

    return (
      <div ref={ref} className="data-table-container">
        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {selectable && (
                  <th style={{ width: '44px', textAlign: 'center', padding: '0 8px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={() => {}}
                      onClick={toggleAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4a3f83' }}
                    />
                  </th>
                )}
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
              {data.map((row, rowIndex) => {
                const isSelected = selectable && selectedIds.has(row.id);
                const canSelect = selectable && (!isRowSelectable || isRowSelectable(row));
                return (
                  <tr
                    key={rowIndex}
                    onClick={() => handleRowClick(row)}
                    className={onRowClick || selectable ? 'cursor-pointer hover:bg-gray-50' : ''}
                    style={isSelected ? { background: '#f0ecfa' } : undefined}
                  >
                    {selectable && (
                      <td style={{ width: '44px', textAlign: 'center', padding: '0 8px' }} onClick={(e) => canSelect && toggleRow(e, row.id)}>
                        {canSelect ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4a3f83' }}
                          />
                        ) : (
                          <input type="checkbox" disabled style={{ width: '16px', height: '16px', opacity: 0.3 }} />
                        )}
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className={col.className}>
                        {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';
