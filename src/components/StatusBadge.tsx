import { InvoiceStatus } from '../types';

interface StatusBadgeProps {
  status: InvoiceStatus;
  short?: boolean;
}

const LABELS: Record<InvoiceStatus, { full: string; short: string }> = {
  submitted: { full: 'Submetida para Pagamento', short: 'Submetida' },
  paid: { full: 'Paga', short: 'Paga' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, short = false }) => (
  <span className={`badge badge-${status}`}>
    {short ? LABELS[status].short : LABELS[status].full}
  </span>
);
