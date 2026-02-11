import React, { useState } from 'react';

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date';
    options?: { value: string; label: string }[];
    placeholder?: string;
  }[];
  onFilterChange: (filters: Record<string, string>) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    const newValues = { ...filterValues, [key]: value };
    setFilterValues(newValues);
    onFilterChange(newValues);
  };

  const handleClear = () => {
    setFilterValues({});
    onFilterChange({});
  };

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        {filters.map((filter) => (
          <div key={filter.key} className="filter-item">
            <label htmlFor={filter.key}>{filter.label}</label>
            {filter.type === 'select' ? (
              <select
                id={filter.key}
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleChange(filter.key, e.target.value)}
              >
                <option value="">Todos</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={filter.key}
                type={filter.type}
                placeholder={filter.placeholder}
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleChange(filter.key, e.target.value)}
              />
            )}
          </div>
        ))}
        <button
          onClick={handleClear}
          className="btn btn-secondary filter-clear-btn"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};
