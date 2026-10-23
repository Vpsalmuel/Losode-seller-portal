import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Listing, Order, OrderEvent, OrderPatch, OrderStatus } from '../api/types';
import { iconArrowLeft, iconCard, iconChevronRight, iconTruck } from '../assets';
import { Badge, Loading, PageHeader, Photo } from '../components/ui';
import {
  dateTime,
  eventTime,
  fulfilmentStatusMeta,
  initials,
  listingPhoto,
  longDate,
  naira,
  orderHeadlineStatusMeta,
  orderTotal,
  type Tone,
} from '../lib/format';
import { useSellerData } from '../state/SellerData';

const DISPATCH_OPEN: OrderStatus[] = ['awaiting_shipment', 'overdue'];
const REFUNDED: OrderStatus[] = ['cancelled', 'returned'];

/** "N.I.C.K Apparels" + "Ankara Print Maxi Dress" + "M" → "NICK-ANK-MD-M". */
const sku = (storeName: string, product: string, size: string) => {
  const words = product.toUpperCase().split(/\s+/);
  const prefix = storeName.split(' ')[0].replace(/\W/g, '').toUpperCase();
  const tail = words.length > 1 ? words.slice(-2).map((w) => w[0]).join('') : '';
  return [prefix, words[0].slice(0, 3), tail, size === 'One size' ? 'OS' : size.toUpperCase()].filter(Boolean).join('-');
};

const lastEvent = (order: Order, event: OrderEvent) => [...order.history].reverse().find((h) => h.event === event)?.at;

function timelineCopy(order: Order, event: OrderEvent): { title: string; text: string } {
  switch (event) {
    case 'placed':
      return { title: 'Order placed', text: `${order.customer} placed this order from your online store.` };
    case 'paid':
      return { title: 'Payment confirmed', text: `${naira(orderTotal(order))} paid by card through ${order.payment.provider}.` };
    case 'awaiting_approval':
      return { title: 'Awaiting approval', text: `Approve or decline this order by ${longDate(order.dueAt)}.` };
    case 'awaiting_shipment':
      return order.history.some((h) => h.event === 'awaiting_approval')
        ? { title: 'Approved', text: 'You approved this order. It is ready to be packed.' }
        : { title: 'Awaiting fulfillment', text: 'Payment received. This order is ready to be packed.' };
    case 'overdue':
      return { title: 'Dispatch overdue', text: 'This order missed its dispatch date. Ship it as soon as you can.' };
    case 'shipped':
      return {
        title: 'Shipped',
        text: order.trackingNumber ? `Handed to ${order.courier ?? 'the courier'} · Tracking ${order.trackingNumber}.` : 'You marked this order as shipped.',
      };
    case 'delivered':
      return { title: 'Delivered', text: `Delivered to ${order.customer} in ${order.city}.` };
    case 'returned':
      return { title: 'Returned', text: `${order.customer} returned this item${order.returnReason ? `: ${order.returnReason.toLowerCase()}` : ''}.` };
    case 'cancelled':
      return { title: 'Cancelled', text: `This order was cancelled. ${order.customer} is refunded in full.` };
  }
}

function fulfilment(order: Order): { dateLabel: string; date: string; urgent?: boolean; nextStep: string } {
  switch (order.status) {
    case 'awaiting_approval':
      return { dateLabel: 'Approve by', date: longDate(order.dueAt), nextStep: 'Approve or decline this order to start fulfillment.' };
    case 'awaiting_shipment':
      return { dateLabel: 'Dispatch by', date: longDate(order.dueAt), nextStep: 'Pack the item and add tracking when shipped.' };
    case 'overdue':
      return { dateLabel: 'Was due', date: longDate(order.dueAt), urgent: true, nextStep: 'This order is late. Ship it now to avoid a cancellation.' };
    case 'shipped':
      return { dateLabel: 'Shipped on', date: longDate(lastEvent(order, 'shipped') ?? order.dueAt), nextStep: `Expected delivery by ${longDate(order.dueAt)}.` };
    case 'delivered':
      return { dateLabel: 'Delivered on', date: longDate(lastEvent(order, 'delivered') ?? order.dueAt), nextStep: 'This order is complete.' };
    case 'returned':
      return { dateLabel: 'Returned on', date: longDate(lastEvent(order, 'returned') ?? order.dueAt), nextStep: `Return reason: ${order.returnReason ?? 'not given'}.` };
    case 'cancelled':
      return { dateLabel: 'Cancelled on', date: longDate(lastEvent(order, 'cancelled') ?? order.dueAt), nextStep: 'Nothing to send for this order.' };
  }
}

/** Prints the page as an invoice, or as a packing slip without prices. */
function printAs(kind: 'invoice' | 'slip') {
  document.documentElement.dataset.print = kind;
  window.addEventListener('afterprint', () => delete document.documentElement.dataset.print, { once: true });
  window.print();
}

export function OrderDetails() {
  const { id } = useParams();
  const { loading, orders, listings } = useSellerData();
  if (loading) return <Loading />;

  const order = orders.find((o) => o.id === id);
  if (!order) {
    return (
      <>
        <PageHeader title="Order not found" subtitle={`There is no order ${id ?? ''} in your store.`} />
        <Link to="/orders" className="back-link">
          ← Back to orders
        </Link>
      </>
    );
  }
  const customerOrders = orders.filter((o) => o.customer === order.customer).length;
  return <OrderView order={order} listing={listings.find((l) => l.id === order.listingId)} customerOrders={customerOrders} />;
}

function Card({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`od-card${className ? ` ${className}` : ''}`}>
      <header className="od-card__head">
        <h2 className="od-card__title">{title}</h2>
        {aside}
      </header>
      <div className="od-card__body">{children}</div>
    </section>
  );
}

type Dialog = { kind: 'ship' | 'tracking' } | { kind: 'confirm'; status: OrderStatus; title: string; text: string; action: string };

function OrderView({ order, listing, customerOrders }: { order: Order; listing?: Listing; customerOrders: number }) {
  const { store, setOrderStatus, updateOrder, notify } = useSellerData();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const run = async (task: () => Promise<void>, message: string) => {
    setBusy(true);
    try {
      await task();
      notify(message);
      setDialog(null);
    } catch {
      notify('Something went wrong — please try again');
    } finally {
      setBusy(false);
    }
  };
  const changeStatus = (status: OrderStatus, message: string, patch?: OrderPatch) =>
    run(() => setOrderStatus(order.id, status, patch), message);

  const headline = orderHeadlineStatusMeta[order.status];
  const refunded = REFUNDED.includes(order.status);
  const payment: { label: string; tone: Tone } = refunded ? { label: 'Refunded', tone: 'neutral' } : { label: 'Paid', tone: 'success' };
  const ff = fulfilment(order);
  const timeline = [...order.history].reverse();
  const items = order.quantity === 1 ? '1 item' : `${order.quantity} items`;
  const mailto = `mailto:${order.email}?subject=${encodeURIComponent(`Your Losóde order ${order.id}`)}`;

  const primary =
    order.status === 'awaiting_approval' ? (
      <button type="button" className="od-btn od-btn--dark" disabled={busy} onClick={() => changeStatus('awaiting_shipment', `Order ${order.id} approved — ship within 3 days`)}>
        Approve order
      </button>
    ) : DISPATCH_OPEN.includes(order.status) ? (
      <button type="button" className="od-btn od-btn--dark" disabled={busy} onClick={() => setDialog({ kind: 'ship' })}>
        Mark as shipped
      </button>
    ) : null;

  const menuItems: { label: string; onSelect: () => void; danger?: boolean }[] = [
    { label: 'Print packing slip', onSelect: () => printAs('slip') },
    {
      label: 'Copy order number',
      onSelect: () =>
        navigator.clipboard
          .writeText(order.id)
          .then(() => notify(`${order.id} copied`))
          .catch(() => notify('Could not copy — select the order number instead')),
    },
    { label: 'Email customer', onSelect: () => (window.location.href = mailto) },
  ];
  if (order.status === 'shipped') {
    menuItems.push(
      { label: order.trackingNumber ? 'Update tracking' : 'Add tracking', onSelect: () => setDialog({ kind: 'tracking' }) },
      { label: 'Mark as delivered', onSelect: () => changeStatus('delivered', `Order ${order.id} marked as delivered`) },
    );
  }
  if (order.status === 'awaiting_approval') {
    menuItems.push({
      label: 'Decline order',
      danger: true,
      onSelect: () =>
        setDialog({ kind: 'confirm', status: 'cancelled', title: 'Decline this order?', text: `${order.customer} will be refunded in full and the order closed. This can't be undone.`, action: 'Decline order' }),
    });
  }
  if (DISPATCH_OPEN.includes(order.status)) {
    menuItems.push({
      label: 'Cancel order',
      danger: true,
      onSelect: () =>
        setDialog({ kind: 'confirm', status: 'cancelled', title: 'Cancel this order?', text: `${order.customer} will be refunded in full. Cancelling paid orders can affect your store rating.`, action: 'Cancel order' }),
    });
  }

  return (
    <div className="od">
      <nav className="od-crumbs" aria-label="Breadcrumb">
        <Link to="/orders">
          <img src={iconArrowLeft} width={16} height={16} alt="" />
          Manage Orders
        </Link>
        <img src={iconChevronRight} width={14} height={14} alt="" />
        <span aria-current="page">{order.id}</span>
      </nav>

      <header className="od-head">
        <div className="od-head__id">
          <div className="od-head__title">
            <h1>Order {order.id}</h1>
            <Badge tone={headline.tone}>{headline.label}</Badge>
            <Badge tone={payment.tone}>{payment.label}</Badge>
          </div>
          <p className="od-head__meta">Placed {dateTime(order.orderedAt)} · Online store</p>
        </div>
        <div className="od-head__actions">
          <button type="button" className="od-btn" onClick={() => printAs('invoice')}>
            Print invoice
          </button>
          <div className="od-menu" ref={menuRef}>
            <button type="button" className="od-btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              More actions
            </button>
            {menuOpen && (
              <div className="od-menu__list" role="menu">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className={item.danger ? 'is-danger' : undefined}
                    onClick={() => {
                      setMenuOpen(false);
                      item.onSelect();
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {primary}
        </div>
      </header>

      <div className="od-grid">
        <div className="od-col">
          <Card title="Order items" aside={<span className="od-card__aside">{items}</span>}>
            <div className="od-item">
              <div className="od-item__photo">
                <Photo {...listingPhoto(listing, 'catalogue')} name={order.product} />
              </div>
              <div className="od-item__info">
                {listing ? (
                  <Link to={`/listings/${listing.id}/edit`} className="od-item__name">
                    {order.product}
                  </Link>
                ) : (
                  <p className="od-item__name">{order.product}</p>
                )}
                <p className="od-item__variant">{[order.colour, `Size ${order.size}`].filter(Boolean).join(' / ')}</p>
                <p className="od-item__sku">SKU: {sku(store?.name ?? '', order.product, order.size)}</p>
                <p className="od-item__unit" data-price>
                  {naira(order.amount / order.quantity)} × {order.quantity}
                </p>
              </div>
              <div className="od-item__total">
                <p data-price>{naira(order.amount)}</p>
                <span>Qty {order.quantity}</span>
              </div>
            </div>
            <hr className="od-divider" />
            <div className="od-item__summary">
              <span>
                {order.status === 'awaiting_approval' || DISPATCH_OPEN.includes(order.status) ? `${items} to fulfill` : `${items} in this order`}
              </span>
              <strong data-price>Subtotal: {naira(order.amount)}</strong>
            </div>
          </Card>

          <Card title="Fulfillment" aside={<Badge tone={fulfilmentStatusMeta[order.status].tone}>{fulfilmentStatusMeta[order.status].label}</Badge>}>
            <div className="od-service">
              <span className="od-service__icon">
                <img src={iconTruck} width={22} height={22} alt="" />
              </span>
              <div>
                <p className="od-strong">{order.deliveryMethod}</p>
                <p className="od-muted">
                  {order.city}, {order.country} · {order.deliveryEstimate}
                </p>
              </div>
            </div>
            <dl className="od-pair">
              <div>
                <dt>{ff.dateLabel}</dt>
                <dd className={ff.urgent ? 'is-danger' : undefined}>{ff.date}</dd>
              </div>
              <div>
                <dt>Tracking number</dt>
                <dd className={order.trackingNumber ? undefined : 'is-plain'}>
                  {order.trackingNumber ? `${order.trackingNumber} · ${order.courier}` : 'Not added yet'}
                </dd>
              </div>
            </dl>
            <hr className="od-divider" />
            <div className="od-next">
              <p>{ff.nextStep}</p>
              {order.status !== 'cancelled' && (
                <button type="button" className="od-btn" onClick={() => printAs('slip')}>
                  Print packing slip
                </button>
              )}
            </div>
          </Card>

          <Card title="Order timeline" aside={<span className="od-card__aside">WAT</span>}>
            <ol className="od-timeline">
              {timeline.map((h, i) => {
                const copy = timelineCopy(order, h.event);
                return (
                  <li key={`${h.event}-${h.at}`} className={i === 0 ? 'is-current' : undefined}>
                    <div className="od-timeline__row">
                      <p className="od-strong">{copy.title}</p>
                      <time dateTime={h.at}>{eventTime(h.at)}</time>
                    </div>
                    <p className="od-muted">{copy.text}</p>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="od-col od-col--side">
          <Card title="Customer information">
            <div className="od-customer">
              <span className="od-customer__initials">{initials(order.customer)}</span>
              <div>
                <p className="od-customer__name">{order.customer}</p>
                <p className="od-muted">{customerOrders > 1 ? `Returning customer · ${customerOrders} orders` : 'Customer'}</p>
              </div>
            </div>
            <div className="od-contact">
              <a href={`mailto:${order.email}`}>{order.email}</a>
              <a href={`tel:${order.phone.replace(/\s/g, '')}`}>{order.phone}</a>
              <a href={mailto} className="od-link">
                Contact customer
              </a>
            </div>
            <hr className="od-divider" />
            <div className="od-address">
              <p className="od-strong">Shipping address</p>
              <address>
                {[order.customer, ...order.address, order.country].map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
            </div>
            <hr className="od-divider" />
            <div className="od-address">
              <p className="od-strong">Billing address</p>
              <p className="od-muted">Same as shipping address</p>
            </div>
          </Card>

          <Card title="Payment summary" className="od-card--payment" aside={<Badge tone={payment.tone}>{payment.label}</Badge>}>
            <dl className="od-costs">
              <div>
                <dt>Subtotal ({items})</dt>
                <dd>{naira(order.amount)}</dd>
              </div>
              <div>
                <dt>Discount</dt>
                <dd>{order.discount ? `−${naira(order.discount)}` : naira(0)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{naira(order.shippingFee)}</dd>
              </div>
            </dl>
            <hr className="od-divider" />
            <div className="od-total">
              <span>Total</span>
              <strong>{naira(orderTotal(order))}</strong>
            </div>
            <p className="od-fine">{refunded ? `${naira(orderTotal(order))} refunded to the customer's card.` : 'All prices include applicable taxes.'}</p>
            <hr className="od-divider" />
            <div className="od-card-method">
              <img src={iconCard} width={24} height={24} alt="" />
              <div>
                <p className="od-strong od-strong--sm">
                  {order.payment.brand} ending in {order.payment.last4}
                </p>
                <p className="od-fine">
                  Paid {longDate(order.payment.paidAt)} · {order.payment.provider}
                </p>
              </div>
            </div>
            <p className="od-reference">Reference: {order.payment.reference}</p>
          </Card>

          <NoteCard order={order} editing={editingNote} setEditing={setEditingNote} />
        </div>
      </div>

      {dialog && (
        <OrderDialog
          dialog={dialog}
          order={order}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={(patch) => {
            if (dialog.kind === 'ship') changeStatus('shipped', `Order ${order.id} marked as shipped`, patch);
            else if (dialog.kind === 'tracking') run(() => updateOrder(order.id, patch ?? {}), 'Tracking updated');
            else if (dialog.kind === 'confirm') changeStatus(dialog.status, `Order ${order.id} cancelled — the customer will be refunded`);
          }}
        />
      )}
    </div>
  );
}

function NoteCard({ order, editing, setEditing }: { order: Order; editing: boolean; setEditing: (v: boolean) => void }) {
  const { updateOrder, notify } = useSellerData();
  const [draft, setDraft] = useState(order.note ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateOrder(order.id, { note: draft.trim() || undefined });
      notify(draft.trim() ? 'Note saved' : 'Note removed');
      setEditing(false);
    } catch {
      notify('Could not save the note — please try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Order note"
      className="od-card--note"
      aside={
        !editing && (
          <button
            type="button"
            className="od-link"
            onClick={() => {
              setDraft(order.note ?? '');
              setEditing(true);
            }}
          >
            {order.note ? 'Edit' : 'Add'}
          </button>
        )
      }
    >
      {editing ? (
        <>
          <textarea
            className="lf-input od-note__input"
            value={draft}
            autoFocus
            maxLength={500}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="E.g. Include a care card before packing"
            aria-label="Order note"
          />
          <div className="od-note__actions">
            <button type="button" className="od-btn" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="button" className="od-btn od-btn--dark" disabled={saving} onClick={save}>
              Save note
            </button>
          </div>
        </>
      ) : (
        <p className={order.note ? 'od-note__text' : 'od-muted'}>{order.note ?? 'No note yet. Add one to remind your team about this order.'}</p>
      )}
      <p className="od-fine">Internal note · Only visible to your team</p>
    </Card>
  );
}

const COURIERS = ['GIG Logistics', 'DHL Express', 'Kwik Delivery', 'Sendbox', 'Other'];

function OrderDialog({
  dialog,
  order,
  busy,
  onClose,
  onConfirm,
}: {
  dialog: Dialog;
  order: Order;
  busy: boolean;
  onClose: () => void;
  onConfirm: (patch?: OrderPatch) => void;
}) {
  const [courier, setCourier] = useState(order.courier ?? (order.country === 'Nigeria' ? COURIERS[0] : COURIERS[1]));
  const [tracking, setTracking] = useState(order.trackingNumber ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shipping = dialog.kind !== 'confirm';
  const title = dialog.kind === 'confirm' ? dialog.title : dialog.kind === 'ship' ? `Ship order ${order.id}` : 'Tracking details';

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" className="dialog__title">
          {title}
        </h2>
        {shipping ? (
          <form
            className="dialog__form"
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm({ courier, trackingNumber: tracking.trim() || undefined });
            }}
          >
            <p className="od-muted">
              {dialog.kind === 'ship' ? `Add tracking so ${order.customer} can follow the parcel. You can add it later too.` : 'Update the courier or tracking number for this parcel.'}
            </p>
            <label className="lf-field">
              <span className="lf-label">Courier</span>
              <select className="lf-input lf-select" value={courier} onChange={(e) => setCourier(e.target.value)}>
                {COURIERS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="lf-field">
              <span className="lf-label">Tracking number</span>
              <input className="lf-input" value={tracking} autoFocus onChange={(e) => setTracking(e.target.value)} placeholder="E.g. GIG48213907" />
            </label>
            <div className="dialog__actions">
              <button type="button" className="od-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="od-btn od-btn--dark" disabled={busy}>
                {dialog.kind === 'ship' ? 'Mark as shipped' : 'Save tracking'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="od-muted">{dialog.text}</p>
            <div className="dialog__actions">
              <button type="button" className="od-btn" autoFocus onClick={onClose}>
                Keep order
              </button>
              <button type="button" className="od-btn od-btn--danger" disabled={busy} onClick={() => onConfirm()}>
                {dialog.action}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
