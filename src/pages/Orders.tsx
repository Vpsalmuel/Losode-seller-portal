import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { OrderStatus } from '../api/types';
import { Badge, KpiCard, Loading, PageHeader, Pager, Photo, TodayChip } from '../components/ui';
import { fulfilmentStatusMeta, listingPhoto, longDate, naira } from '../lib/format';
import { useSellerData } from '../state/SellerData';

const PAGE_SIZE = 6;

export function Orders() {
  const { loading, orders, listings, pendingOrders } = useSellerData();
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const listingById = new Map(listings.map((l) => [l.id, l]));

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  if (loading) return <Loading />;

  const visible = showAll ? orders : orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const first = orders.length === 0 ? 0 : showAll ? 1 : (page - 1) * PAGE_SIZE + 1;
  const last = showAll ? orders.length : Math.min(page * PAGE_SIZE, orders.length);
  const count = (status: OrderStatus) => orders.filter((o) => o.status === status).length;

  return (
    <>
      <PageHeader
        title="Manage Orders"
        subtitle="Oversee, filter and process store order items from your customers"
        actions={<TodayChip />}
      />

      <div className="grid grid--4">
        <KpiCard variant="status" label="Total Orders" value={orders.length} foot="All time records" />
        <KpiCard variant="status" label="Pending Fulfillment" value={pendingOrders.length} valueTone="amber" foot="Requires attention" />
        <KpiCard variant="status" label="Shipped" value={count('shipped')} valueTone="info" foot="In-transit with courier" />
        <KpiCard variant="status" label="Delivered" value={count('delivered')} valueTone="success" foot="Successfully completed" />
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">
            Orders <span>{orders.length} Items</span>
          </h2>
          {orders.length > PAGE_SIZE && (
            <button type="button" className="panel__link" onClick={() => setShowAll((s) => !s)}>
              {showAll ? 'Show pages' : 'View all'}
            </button>
          )}
        </div>

        <div className="panel__body">
          {visible.length > 0 ? (
            <div className="cards-3">
              {visible.map((order) => {
                const listing = listingById.get(order.listingId);
                const status = fulfilmentStatusMeta[order.status];
                return (
                  <Link key={order.id} to={`/orders/${order.id}`} className="fulfil-card">
                    <Photo {...listingPhoto(listing, 'catalogue')} name={order.product} />
                    <div className="fulfil-card__body">
                      <p className="fulfil-card__strong">{order.id}</p>
                      <p className="fulfil-card__strong">{order.product}</p>
                      <p className="fulfil-card__meta">{order.customer}</p>
                      <p className="fulfil-card__meta">{naira(order.amount)}</p>
                      <p className="fulfil-card__meta">{longDate(order.orderedAt)}</p>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="empty">No orders yet. They'll appear here as soon as a customer checks out.</p>
          )}
        </div>

        <div className="panel__foot">
          <span>
            Showing {first}-{last} of {orders.length} orders
          </span>
          {!showAll && <Pager page={page} pageCount={pageCount} onChange={setPage} label="Orders pages" />}
        </div>
      </section>

    </>
  );
}

