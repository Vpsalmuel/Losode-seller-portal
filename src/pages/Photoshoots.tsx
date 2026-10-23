import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { PhotoshootSession } from '../api/types';
import { iconInfo } from '../assets';
import { BookShootButton, SessionCard, UpcomingCard, isUpcoming, usePhotoshoots } from '../components/photoshoot';
import { Loading, PageHeader } from '../components/ui';
import { longDate } from '../lib/format';
import { useSellerData } from '../state/SellerData';

export function Photoshoots() {
  const { notify } = useSellerData();
  const { sessions, setSessions, packages } = usePhotoshoots();
  const [cancelling, setCancelling] = useState<PhotoshootSession | null>(null);
  if (!sessions) return <Loading />;

  const upcoming = sessions.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const previous = sessions.filter((s) => !isUpcoming(s)).slice(0, 3);

  const cancel = async (s: PhotoshootSession) => {
    try {
      await api.cancelPhotoshoot(s.id);
      setSessions((all) => all?.filter((x) => x.id !== s.id) ?? null);
      notify(`Shoot request for ${longDate(s.startsAt)} cancelled`);
    } catch {
      notify('Could not cancel — please try again');
    }
    setCancelling(null);
  };

  return (
    <div className="ps">
      <PageHeader
        title="Photoshoots"
        subtitle="Book and manage high-quality marketplace model shoots."
        actions={<BookShootButton packages={packages} onBooked={(s) => setSessions((all) => [s, ...(all ?? [])])} />}
      />

      <section className="ps-section">
        <h2 className="ps-section__title">Upcoming Photoshoots</h2>
        {upcoming.length > 0 ? (
          <div className="ps-upcoming-grid">
            {upcoming.map((s) => (
              <UpcomingCard key={s.id} session={s} onCancel={s.status === 'pending' ? () => setCancelling(s) : undefined} />
            ))}
          </div>
        ) : (
          <p className="ps-empty">No shoots booked. Book one to get studio-quality photos for your next listings.</p>
        )}
      </section>

      <section className="ps-section">
        <div className="ps-section__head">
          <h2 className="ps-section__title">Previous Sessions</h2>
          {previous.length > 0 && (
            <Link to="/photoshoots/sessions" className="ps-view-all">
              View All →
            </Link>
          )}
        </div>
        {previous.length > 0 ? (
          <div className="ps-grid">
            {previous.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <p className="ps-empty">Your finished shoots and their photos will appear here.</p>
        )}
      </section>

      <aside className="ps-tip">
        <img src={iconInfo} width={24} height={24} alt="" />
        <p>
          <strong>Pro Tip:</strong> Schedule your photoshoot at least 2 weeks before listing new items for best results and timely asset delivery.
        </p>
      </aside>

      {cancelling && (
        <>
          <div className="drawer-scrim" onClick={() => setCancelling(null)} />
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
            <h2 id="cancel-title" className="dialog__title">
              Cancel this shoot request?
            </h2>
            <p className="od-muted">
              The {longDate(cancelling.startsAt)} request at {cancelling.location} will be withdrawn. You haven't been charged yet.
            </p>
            <div className="dialog__actions">
              <button type="button" className="od-btn" autoFocus onClick={() => setCancelling(null)}>
                Keep request
              </button>
              <button type="button" className="od-btn od-btn--danger" onClick={() => cancel(cancelling)}>
                Cancel request
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
