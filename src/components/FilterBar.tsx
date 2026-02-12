import React, { useState } from 'react';
import { DateInputWithPicker } from './DateInputWithPicker';

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

  const limitYearTo4Digits = (value: string) => {
    if (!value) return '';

    const [year = '', ...rest] = value.split('-');
    return [year.slice(0, 4), ...rest].join('-');
  };

  const normalizeFilterValue = (key: string, value: string) => {
    const filter = filters.find((item) => item.key === key);

    if (filter?.type === 'date') {
      return limitYearTo4Digits(value);
    }

    return value;
  };

  const handleChange = (key: string, value: string) => {
    const normalizedValue = normalizeFilterValue(key, value);
    const newValues = { ...filterValues, [key]: normalizedValue };
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
              ) : filter.type === 'date' ? (
              <DateInputWithPicker
                id={filter.key}
                value={filterValues[filter.key] || ''}
                onChange={(value) => handleChange(filter.key, value)}
                ariaLabel={`Abrir calendário do filtro ${filter.label.toLowerCase()}`}
                placeholder={filter.placeholder}
              />
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
          className="btn filter-clear-btn"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};
