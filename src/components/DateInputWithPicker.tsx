import React, { useEffect, useMemo, useRef, useState } from 'react';

interface DateInputWithPickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  placeholder?: string;
}

export const DateInputWithPicker: React.FC<DateInputWithPickerProps> = ({
  id,
  value,
  onChange,
  disabled = false,
  ariaLabel,
  placeholder,
}) => {
  const pickerInputRef = useRef<HTMLInputElement | null>(null);
  const [displayValue, setDisplayValue] = useState('');
  const [hasInvalidDate, setHasInvalidDate] = useState(false);

  const normalizedDisplayValue = useMemo(() => {
    if (!value) return '';

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return value;

    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }, [value]);

  useEffect(() => {
    setDisplayValue(normalizedDisplayValue);
    setHasInvalidDate(false);
  }, [normalizedDisplayValue]);

  const formatDigitsToPtDate = (digits: string): string => {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const parsePtDateToIso = (ptDate: string): string | undefined => {
    const match = ptDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return undefined;

    const [, day, month, year] = match;
    const isoDate = `${year}-${month}-${day}`;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      parsed.getFullYear() !== Number(year)
      || parsed.getMonth() !== Number(month) - 1
      || parsed.getDate() !== Number(day)
    ) {
      return undefined;
    }

    return isoDate;
  };

  const handleTextChange = (nextValue: string) => {
    const isoMatch = nextValue.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const formattedIso = `${day}/${month}/${year}`;
      const isoDate = parsePtDateToIso(formattedIso);

      setDisplayValue(formattedIso);
      if (isoDate) {
        setHasInvalidDate(false);
        onChange(isoDate);
      }
      return;
    }

    const digits = nextValue.replace(/\D/g, '').slice(0, 8);
    const formatted = formatDigitsToPtDate(digits);

    setDisplayValue(formatted);

    if (digits.length === 0) {
      setHasInvalidDate(false);
      onChange('');
      return;
    }

    if (digits.length < 8) {
      setHasInvalidDate(false);
      return;
    }

    const isoDate = parsePtDateToIso(formatted);
    if (!isoDate) {
      setHasInvalidDate(true);
      return;
    }

    setHasInvalidDate(false);
    onChange(isoDate);
  };

  const openPicker = () => {
     const input = pickerInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;

    if (!input || disabled) {
      return;
    }

    if (input.showPicker) {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div className="date-field">
      <input
        id={id}
        type="text"
        value={displayValue}
        onChange={(e) => handleTextChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder ?? 'dd/mm/aaaa'}
        className={`date-field-input ${hasInvalidDate ? 'date-field-input-invalid' : ''}`.trim()}
        inputMode="numeric"
        maxLength={10}
        aria-label={ariaLabel}
        aria-invalid={hasInvalidDate}
      />
      <input
        ref={pickerInputRef}
        id={`${id}-picker`}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
      />
      <button
        type="button"
        className="date-field-trigger"
        onClick={openPicker}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="date-field-icon">
          <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 9H4v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8ZM5 6a1 1 0 0 0-1 1v2h16V7a1 1 0 0 0-1-1H5Z" />
        </svg>
      </button>
    </div>
  );
};