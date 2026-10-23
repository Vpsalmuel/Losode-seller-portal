import type { Listing, ListingInput, ListingStatus, Order, OrderStatus, Payout, Store } from '../api/types';

/** Everything about a listing except its server-assigned id and creation date. */
export const listingToInput = (l: Listing): ListingInput => {
  const input: Partial<Listing> = structuredClone(l);
  delete input.id;
  delete input.createdAt;
  return input as ListingInput;
};

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export const naira = (amount: number) => nairaFormatter.format(amount);

/** ₦2.4M / ₦850K style, as used on the KPI cards. */
export const nairaCompact = (amount: number) => {
  if (amount >= 1_000_000) return `₦${+(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${+(amount / 1_000).toFixed(1)}K`;
  return naira(amount);
};

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const greeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export type Tone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

/** Order status badges, using the Manage Orders colour scheme everywhere. */
export const orderStatusMeta: Record<OrderStatus, { label: string; tone: Tone }> = {
  awaiting_approval: { label: 'Awaiting Approval', tone: 'info' },
  awaiting_shipment: { label: 'Awaiting Shipment', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  shipped: { label: 'Shipped', tone: 'info' },
  delivered: { label: 'Delivered', tone: 'success' },
  returned: { label: 'Returned', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/** Manage Orders shows awaiting-shipment orders with the shorter "Pending" label. */
export const fulfilmentStatusMeta: Record<OrderStatus, { label: string; tone: Tone }> = {
  ...orderStatusMeta,
  awaiting_shipment: { label: 'Pending', tone: 'warning' },
};

/** Best photo for a listing on a given surface, with the focal point to crop around. */
export const listingPhoto = (
  l: Listing | undefined,
  prefer: 'cover' | 'catalogue',
): { src?: string; focusY?: number } => {
  if (!l) return {};
  const useCover = prefer === 'cover' ? !!l.coverImage : !l.image && !!l.coverImage;
  return useCover ? { src: l.coverImage, focusY: l.coverFocusY } : { src: l.image };
};

export const listingStatusMeta: Record<ListingStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  draft: { label: 'Draft', tone: 'neutral' },
  sold_out: { label: 'Sold Out', tone: 'danger' },
};

export const PENDING_STATUSES: OrderStatus[] = ['awaiting_approval', 'awaiting_shipment', 'overdue'];

/** "Oct 28, 2024 at 10:42 AM" */
export const dateTime = (iso: string) =>
  `${longDate(iso)} at ${new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

/** "Oct 28 · 10:44 AM", as on the order timeline. */
export const eventTime = (iso: string) =>
  `${shortDate(iso)} · ${new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

/** The status badge beside the order number on the order details page. */
export const orderHeadlineStatusMeta: Record<OrderStatus, { label: string; tone: Tone }> = {
  ...orderStatusMeta,
  awaiting_shipment: { label: 'Pending fulfillment', tone: 'warning' },
};

export const orderTotal = (o: Order) => o.amount - o.discount + o.shippingFee;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** The public storefront address, without the protocol. */
export const storeUrl = (store: Store) => `losode.com/store/${store.slug}`;

export const maskAccount = (accountNumber: string) => `****${accountNumber.slice(-4)}`;

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'Sale' | 'Payout' | 'Refund';
  /** Positive money in, negative money out. A failed payout keeps the amount it tried to send. */
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

/** Money in and out of the store, newest first: sales, refunds and bank payouts. */
export function transactions(orders: Order[], payouts: Payout[]): Transaction[] {
  const rows: Transaction[] = [];
  for (const o of orders) {
    if (o.status === 'awaiting_approval') continue;
    rows.push({
      id: `sale-${o.id}`,
      date: o.orderedAt,
      description: `Sale - ${o.product}`,
      type: 'Sale',
      amount: o.amount,
      // Sales clear once the customer has the item (or the order is closed and refunded).
      status: ['delivered', 'returned', 'cancelled'].includes(o.status) ? 'Completed' : 'Pending',
    });
    if (o.status === 'returned' || o.status === 'cancelled') {
      const at = [...o.history].reverse().find((h) => h.event === o.status)?.at ?? o.dueAt;
      rows.push({
        id: `refund-${o.id}`,
        date: at,
        description: `Refund - ${o.product} (${o.status === 'returned' ? 'Return' : 'Cancelled'})`,
        type: 'Refund',
        amount: -o.amount,
        status: 'Completed',
      });
    }
  }
  for (const p of payouts) {
    if (p.status === 'scheduled') continue;
    rows.push({
      id: `payout-${p.id}`,
      date: p.date,
      description: p.status === 'failed' ? `Payout to ${p.bankName} - Failed, retried` : `Payout to ${p.bankName} Account`,
      type: 'Payout',
      amount: -p.amount,
      status: p.status === 'paid' ? 'Completed' : p.status === 'failed' ? 'Failed' : 'Pending',
    });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}
