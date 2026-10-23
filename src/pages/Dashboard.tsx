import { Link } from 'react-router-dom';
import { iconStar } from '../assets';
import { PromoCards } from '../components/PromoCards';
import { Badge, KpiCard, Loading, OrderTile, PageHeader, SectionHeader, TodayChip } from '../components/ui';
import { greeting, listingStatusMeta, naira, nairaCompact } from '../lib/format';
import { useSellerData } from '../state/SellerData';

const NEW_ORDER_COUNT = 6;

export function Dashboard() {
  const { loading, store, stats, orders, listings, pendingOrders } = useSellerData();
  if (loading || !store || !stats) return <Loading />;

  const activeListings = listings.filter((l) => l.status === 'active').length;
  const recentOrders = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'returned')
    .slice(0, NEW_ORDER_COUNT);
  const listingById = new Map(listings.map((l) => [l.id, l]));

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${store.ownerFirstName}`}
        subtitle="Here is your store performance overview today."
        actions={<TodayChip />}
      />

      <div className="grid grid--4">
        <KpiCard label="Items Listed" value={activeListings} foot="Active in storefront" />
        <KpiCard label="Items Sold" value={stats.itemsSold} trend={stats.itemsSoldTrend} foot="vs last month" />
        <KpiCard
          label="Orders Pending"
          value={pendingOrders.length}
          foot="Requires attention"
          variant={pendingOrders.length > 0 ? 'alert' : undefined}
        />
        <KpiCard label="Revenue This Month" value={nairaCompact(stats.revenueThisMonth)} trend={stats.revenueTrend} foot="vs last month" />
      </div>

      <section className="section">
        <SectionHeader title="Store Performance Summary" />
        <div className="grid grid--3">
          <div className="perf">
            <p className="perf__label">Total Revenue (All Time)</p>
            <p className="perf__value">{nairaCompact(stats.totalRevenue)}</p>
          </div>
          <div className="perf">
            <p className="perf__label">Average Order Value</p>
            <p className="perf__value">{naira(stats.averageOrderValue)}</p>
          </div>
          <div className="perf">
            <p className="perf__label">Customer Rating</p>
            <p className="perf__value">
              {stats.rating}/5
              <img src={iconStar} width={16} height={16} alt="" />
            </p>
          </div>
        </div>
      </section>

      <section className="section section--orders">
        <SectionHeader
          title="New Orders"
          large
          count={<span className="pill-count">{pendingOrders.length} orders</span>}
          link={{ to: '/orders', label: 'View All Orders' }}
        />
        {recentOrders.length > 0 ? (
          <div className="cards-3">
            {recentOrders.map((order) => (
              <OrderTile key={order.id} order={order} listing={listingById.get(order.listingId)} />
            ))}
          </div>
        ) : (
          <div className="card card--rounded empty">No open orders right now.</div>
        )}
      </section>

      <section className="section">
        <SectionHeader title="Your Listings" link={{ to: '/listings', label: 'Manage All' }} />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th className="table__w-price">Price</th>
                <th className="table__w-status">Status</th>
                <th className="table__w-stock">Stock</th>
              </tr>
            </thead>
            <tbody>
              {listings.slice(0, 4).map((listing) => {
                const status = listingStatusMeta[listing.status];
                return (
                  <tr key={listing.id}>
                    <td className="col-primary">
                      <Link to={`/listings/${listing.id}/edit`}>{listing.name}</Link>
                    </td>
                    <td className="col-num">{naira(listing.price)}</td>
                    <td>
                      <Badge tone={status.tone} small>
                        {status.label}
                      </Badge>
                    </td>
                    <td className={listing.status === 'sold_out' ? 'is-danger' : undefined}>
                      {listing.status === 'draft' ? '-' : `${listing.stock} left`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <PromoCards />
    </>
  );
}
