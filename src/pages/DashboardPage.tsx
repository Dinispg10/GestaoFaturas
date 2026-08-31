import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { StatusBadge } from '../components/StatusBadge';

interface RecentInvoice {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  status: 'submitted' | 'paid';
}

interface MonthData { month: string; total: number }
interface SupplierData { name: string; total: number }

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PRIMARY = '#4a3f83';
const SUPPLIER_COLORS = ['#4a3f83', '#6b5fa6', '#8b7fc0', '#a99fd8', '#c8bfeb'];

const MONTH_COLORS = ['#4a3f83', '#6b5fa6', '#8b7fc0', '#a99fd8', '#c8bfeb', '#ddd8f0'];

const monthColorsByRank = (data: MonthData[]): string[] => {
  const ranked = [...data]
    .map((d, i) => ({ i, total: d.total }))
    .sort((a, b) => b.total - a.total);
  const colorMap = new Array(data.length).fill('');
  ranked.forEach((entry, rank) => {
    colorMap[entry.i] = MONTH_COLORS[rank] ?? MONTH_COLORS[MONTH_COLORS.length - 1];
  });
  return colorMap;
};


const fmt = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);

const fmtShort = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k€` : `${n.toFixed(0)}€`;

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-PT');

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isOverdue = (inv: RecentInvoice) => {
  if (inv.status === 'paid' || !inv.dueDate) return false;
  return inv.dueDate < todayLocal();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #ddd8e8', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: PRIMARY, marginBottom: '4px' }}>{label}</div>
      <div style={{ color: '#555' }}>{fmt(payload[0].value)}</div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [recent, setRecent] = useState<RecentInvoice[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const sixMonthsAgoDate = (() => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      })();

      const [recentRes, monthlyRes, suppliersRes] = await Promise.all([
        supabase.from('invoices')
          .select('id, supplier_name_snapshot, invoice_number, invoice_date, due_date, total_amount, status')
          .order('created_at', { ascending: false }).limit(6),
        supabase.from('invoices')
          .select('invoice_date, total_amount')
          .gte('invoice_date', sixMonthsAgoDate)
          .limit(10000),
        supabase.from('invoices')
          .select('supplier_name_snapshot, total_amount')
          .limit(10000),
      ]);

      setRecent((recentRes.data ?? []).map((r: any) => ({
        id: r.id,
        supplierName: r.supplier_name_snapshot,
        invoiceNumber: r.invoice_number,
        invoiceDate: r.invoice_date,
        dueDate: r.due_date,
        totalAmount: r.total_amount,
        status: r.status,
      })));

      const monthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthMap[`${d.getFullYear()}-${d.getMonth()}`] = 0;
      }
      for (const row of monthlyRes.data ?? []) {
        if (!row.invoice_date) continue;
        const d = new Date(row.invoice_date + 'T00:00:00');
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in monthMap) monthMap[key] += row.total_amount || 0;
      }
      setMonthlyData(
        Object.entries(monthMap).map(([key, total]) => {
          const [year, month] = key.split('-').map(Number);
          const label = now.getFullYear() !== year
            ? `${MONTH_NAMES[month]} ${String(year).slice(2)}`
            : MONTH_NAMES[month];
          return { month: label, total };
        })
      );

      const supMap: Record<string, number> = {};
      for (const row of suppliersRes.data ?? []) {
        const name = row.supplier_name_snapshot || 'Desconhecido';
        supMap[name] = (supMap[name] || 0) + (row.total_amount || 0);
      }
      setSupplierData(
        Object.entries(supMap)
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
      );

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: PRIMARY, marginBottom: '24px' }}>
        Dashboard
      </h2>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #ddd8e8', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(37,28,57,0.06)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: PRIMARY, marginBottom: '16px' }}>Gastos por Mês</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={28} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ecfa" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#677283' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#677283' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f1fa' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {monthColorsByRank(monthlyData).map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', border: '1px solid #ddd8e8', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(37,28,57,0.06)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: PRIMARY, marginBottom: '16px' }}>Top Fornecedores</div>
          {supplierData.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: '13px', marginTop: '40px', textAlign: 'center' }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={supplierData} layout="vertical" barSize={18} margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ecfa" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#677283' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#677283' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f1fa' }} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {supplierData.map((_, i) => (
                    <Cell key={i} fill={SUPPLIER_COLORS[i] ?? '#c8bfeb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div style={{ background: '#fff', border: '1px solid #ddd8e8', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(37,28,57,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #ece7f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: PRIMARY }}>Faturas Recentes</span>
          <Link to="/faturas" style={{ fontSize: '13px', color: PRIMARY, fontWeight: 600, textDecoration: 'none' }}>Ver todas →</Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>Nenhuma fatura encontrada.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f7fd' }}>
                {['Fornecedor', 'Nº Fatura', 'Data', 'Vencimento', 'Total', 'Estado'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#677283', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #ece7f5' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((inv, i) => {
                const overdue = isOverdue(inv);
                return (
                  <tr key={inv.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid #f0ecfa' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>
                      <Link to={`/faturas/${inv.id}`} style={{ color: PRIMARY, textDecoration: 'none' }}>{inv.supplierName}</Link>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>{fmtDate(inv.invoiceDate)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: overdue ? '#d32f2f' : '#555', fontWeight: overdue ? 600 : 400 }}>
                      {inv.dueDate ? fmtDate(inv.dueDate) : '—'}
                      {overdue && <span style={{ marginLeft: '4px' }}>⚠</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#333' }}>{fmt(inv.totalAmount)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={inv.status} short />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
