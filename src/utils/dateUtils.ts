export const parseDateOnly = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      parsed.getFullYear() === Number(year)
      && parsed.getMonth() === Number(month) - 1
      && parsed.getDate() === Number(day)
    ) {
      return parsed;
    }

    return undefined;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const formatDateOnlyForInput = (value?: string | Date | null): string => {
  const parsed = parseDateOnly(value);
  if (!parsed) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatDateOnlyForDisplay = (value?: string | Date | null): string => {
  const parsed = parseDateOnly(value);
  if (!parsed) return '—';

  return parsed.toLocaleDateString('pt-PT');
};