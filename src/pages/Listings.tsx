import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Listing } from '../api/types';
import { iconCopy, iconEdit } from '../assets';
import { PromoCards } from '../components/PromoCards';
import { Badge, KpiCard, Loading, PageHeader, Photo, SectionHeader, TodayChip } from '../components/ui';
import { listingPhoto, listingStatusMeta, listingToInput, naira, nairaCompact } from '../lib/format';
import { useSellerData } from '../state/SellerData';

const cardDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

export function Listings() {
  const { loading, listings, stats } = useSellerData();
  if (loading || !stats) return <Loading />;

  const active = listings.filter((l) => l.status === 'active').length;
  const drafts = listings.filter((l) => l.status === 'draft').length;
  const newestFirst = [...listings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title="Your Listings"
        subtitle="Manage, update and publish your storefront products easily"
        actions={<TodayChip />}
      />

      <div className="grid grid--4">
        <KpiCard label="Items Listed" value={listings.length} foot="Across your storefront" />
        <KpiCard label="Active Listings" value={active} trend={stats.activeListingsTrend} foot="vs last month" />
        <KpiCard label="Saved Listings" value={drafts} foot={drafts > 0 ? 'Requires attention' : 'No drafts waiting'} variant="muted" />
        <KpiCard label="Revenue This Month" value={nairaCompact(stats.revenueThisMonth)} trend={stats.revenueTrend} foot="vs last month" />
      </div>

      <section className="section section--orders">
        <SectionHeader title="New Listings" large />
        <div className="panel">
          <div className="panel__body panel__body--tight">
            {newestFirst.length > 0 ? (
              <div className="cards-3">
                {newestFirst.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className="empty">
                No listings yet. <Link to="/listings/new" className="section__link">List your first item →</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      <PromoCards />
    </>
  );
}

function ProductCard({ listing }: { listing: Listing }) {
  const { saveListing, notify } = useSellerData();
  const navigate = useNavigate();
  const [copying, setCopying] = useState(false);
  const status = listingStatusMeta[listing.status];

  const duplicate = async () => {
    setCopying(true);
    try {
      const copy = await saveListing({ ...listingToInput(listing), name: `${listing.name} (Copy)`, status: 'draft' });
      notify(`Draft copy created — edit it before publishing`);
      navigate(`/listings/${copy.id}/edit`);
    } catch {
      notify('Could not duplicate — please try again');
      setCopying(false);
    }
  };

  return (
    <article className="product-card">
      <Photo {...listingPhoto(listing, 'catalogue')} name={listing.name} />
      <div className="product-card__body">
        <h3 className="product-card__name">{listing.name}</h3>
        <div className="product-card__meta">
          <div className="product-card__row">
            <span>{naira(listing.price)}</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="product-card__row">
            <span className={listing.status === 'sold_out' ? 'is-danger' : undefined}>
              {listing.status === 'draft' ? '-' : `${listing.stock} left`}
            </span>
            <span>{cardDate(listing.createdAt)}</span>
          </div>
        </div>
        <div className="product-card__actions">
          <Link to={`/listings/${listing.id}/edit`} className="icon-action" aria-label={`Edit ${listing.name}`} title="Edit">
            <img src={iconEdit} width={16} height={16} alt="" />
          </Link>
          <button
            type="button"
            className="icon-action"
            onClick={duplicate}
            disabled={copying}
            aria-label={`Duplicate ${listing.name}`}
            title="Duplicate as draft"
          >
            <img src={iconCopy} width={16} height={16} alt="" />
          </button>
        </div>
      </div>
    </article>
  );
}
