import React, { useRef } from 'react';

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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;

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
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="date-field-input"
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