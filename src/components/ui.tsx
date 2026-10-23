import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Listing, Order } from '../api/types';
import { listingPhoto, longDate, naira, orderStatusMeta, type Tone } from '../lib/format';

/** "Today: Oct 23, 2026" chip shown on the right of page headers. */
export function TodayChip() {
  return <span className="chip-box">Today: {longDate(new Date().toISOString())}</span>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function Badge({ tone, children, small }: { tone: Tone; children: ReactNode; small?: boolean }) {
  return <span className={`badge badge--${tone}${small ? ' badge--sm' : ''}`}>{children}</span>;
}

export function SectionHeader({
  title,
  count,
  link,
  large,
}: {
  title: string;
  count?: ReactNode;
  link?: { to: string; label: string };
  large?: boolean;
}) {
  return (
    <div className="section__header">
      <h2 className={`section__title${large ? ' section__title--lg' : ''}`}>
        {title}
        {count}
      </h2>
      {link && (
        <Link to={link.to} className="section__link">
          {link.label} →
        </Link>
      )}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  foot,
  trend,
  variant,
  valueTone,
}: {
  label: string;
  value: ReactNode;
  foot: string;
  trend?: number;
  /** alert: red attention card; muted: all-grey card; status: Manage Orders style. */
  variant?: 'alert' | 'muted' | 'status';
  valueTone?: 'amber' | 'info' | 'success';
}) {
  const variantClass =
    variant === 'alert' ? ' card--danger kpi--alert' : variant === 'muted' ? ' card--danger kpi--muted' : variant ? ` kpi--${variant}` : '';
  return (
    <div className={`card kpi${variantClass}`}>
      <p className="kpi__label">{label}</p>
      <p className={`kpi__value${valueTone ? ` kpi__value--${valueTone}` : ''}`}>{value}</p>
      <p className="kpi__foot">
        {trend !== undefined && (
          <span className={`kpi__trend${trend < 0 ? ' kpi__trend--down' : ''}`}>
            {trend < 0 ? '↓' : '↑'} {Math.abs(trend)}%
          </span>
        )}
        {foot}
      </p>
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Product photo that fills its box, with an initials fallback when there is no photo. */
export function Photo({ src, name, focusY }: { src?: string; name: string; focusY?: number }) {
  return (
    <div className="photo">
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          style={focusY !== undefined ? { objectPosition: `center ${focusY}%` } : undefined}
        />
      ) : (
        <span className="photo__placeholder" aria-hidden="true">
          {initials(name)}
        </span>
      )}
    </div>
  );
}

/** New Orders card on the dashboard. */
export function OrderTile({ order, listing }: { order: Order; listing?: Listing }) {
  const status = orderStatusMeta[order.status];
  return (
    <Link to={`/orders/${order.id}`} className="order-tile">
      <Photo {...listingPhoto(listing, 'cover')} name={order.product} />
      <div className="order-tile__body">
        <p className="order-tile__name">{order.product}</p>
        {listing?.description && <p className="order-tile__desc">{listing.description}</p>}
        <p className="order-tile__date">Ordered {longDate(order.orderedAt)}</p>
        <div className="order-tile__foot">
          <span className="order-tile__price">{naira(order.amount)}</span>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>
    </Link>
  );
}

export function Loading() {
  return <div className="loading">Loading your store…</div>;
}

/** Previous / numbered pages / Next. */
export function Pager({
  page,
  pageCount,
  onChange,
  label,
  large,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  label: string;
  large?: boolean;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className={`pager${large ? ' pager--lg' : ''}`} aria-label={label}>
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={n === page ? 'is-current' : undefined}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
