import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { KpiCard, Loading, PageHeader } from '../components/ui';
import { naira, nairaCompact } from '../lib/format';
import { useSellerData } from '../state/SellerData';

const BRAND = '#af231c';
const GOLD = '#cf9e4e';
const GRID = '#f1f5f9';
const AXIS = { fontSize: 12, fill: '#94a3b8' };

function MoneyTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <p className="chart-tooltip__value">{naira(Number(payload[0].value))}</p>
    </div>
  );
}

export function Analytics() {
  const { loading, stats, orders } = useSellerData();
  if (loading || !stats) return <Loading />;

  const yearRevenue = stats.monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const yearOrders = stats.monthlyRevenue.reduce((s, m) => s + m.orders, 0);

  const topProducts = Object.values(
    orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'returned')
      .reduce<Record<string, { name: string; units: number; revenue: number }>>((acc, o) => {
        acc[o.product] ??= { name: o.product, units: 0, revenue: 0 };
        acc[o.product].units += o.quantity;
        acc[o.product].revenue += o.amount;
        return acc;
      }, {}),
  )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <>
      <PageHeader title="Analytics" subtitle="How your storefront performed over the last 12 months." />

      <div className="grid grid--4">
        <KpiCard label="Revenue (12 Months)" value={nairaCompact(yearRevenue)} trend={stats.revenueTrend} foot="vs prior period" />
        <KpiCard label="Orders (12 Months)" value={yearOrders} trend={stats.itemsSoldTrend} foot="vs prior period" />
        <KpiCard label="Store Visits" value={stats.storeVisits.toLocaleString('en-NG')} foot="Last 12 months" />
        <KpiCard label="Conversion Rate" value={`${stats.conversionRate}%`} foot="Visits that ordered" />
      </div>

      <div className="card chart-card">
        <div className="chart-card__head">
          <h2 className="section__title">Monthly Revenue</h2>
          <span className="legend">
            <span>
              <span className="legend__swatch" style={{ background: BRAND }} />
              Revenue
            </span>
          </span>
        </div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthlyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={nairaCompact} width={64} />
              <Tooltip content={<MoneyTooltip />} cursor={{ stroke: '#e2e8f0' }} />
              <Area type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card chart-card">
          <div className="chart-card__head">
            <h2 className="section__title">Revenue by Category</h2>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesByCategory} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={nairaCompact} />
                <YAxis type="category" dataKey="category" tick={AXIS} axisLine={false} tickLine={false} width={88} />
                <Tooltip content={<MoneyTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="revenue" fill={GOLD} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-card__head">
            <h2 className="section__title">Top Products</h2>
            <span className="legend">Recent orders</span>
          </div>
          <ol className="rank-list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {topProducts.map((p, i) => (
              <li key={p.name} className="rank-item">
                <span className="rank-item__pos">{String(i + 1).padStart(2, '0')}</span>
                <span className="rank-item__name">{p.name}</span>
                <span className="rank-item__meta">
                  {p.units} sold · {naira(p.revenue)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
