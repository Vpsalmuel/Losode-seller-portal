import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { PhotoshootPackage, PhotoshootSession, PhotoshootStatus } from '../api/types';
import { iconMapPin, iconPackage, iconUser } from '../assets';
import { longDate, naira, shortDate, type Tone } from '../lib/format';
import { useSellerData } from '../state/SellerData';
import { Badge } from './ui';

export const photoshootStatusMeta: Record<PhotoshootStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  processing: { label: 'Editing', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
};

/** Sessions and packages, loaded once per page. */
export function usePhotoshoots() {
  const [sessions, setSessions] = useState<PhotoshootSession[] | null>(null);
  const [packages, setPackages] = useState<PhotoshootPackage[]>([]);
  useEffect(() => {
    Promise.all([api.getPhotoshoots(), api.getPhotoshootPackages()]).then(([s, p]) => {
      setSessions(s);
      setPackages(p);
    });
  }, []);
  return { sessions, setSessions, packages };
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** "9:00 AM – 2:00 PM" */
export const shootHours = (s: PhotoshootSession) => `${clock(s.startsAt)} – ${clock(s.endsAt)}`;

export const isUpcoming = (s: PhotoshootSession) => s.status === 'pending' || s.status === 'confirmed';

export const photoCount = (s: PhotoshootSession) => (s.photos.length === 1 ? '1 photo' : `${s.photos.length} photos`);

export const itemCount = (n: number) => (n === 1 ? '1 item' : `${n} items`);

export function UpcomingCard({ session, onCancel }: { session: PhotoshootSession; onCancel?: () => void }) {
  const status = photoshootStatusMeta[session.status];
  return (
    <article className="ps-upcoming">
      <header className="ps-upcoming__head">
        <div>
          <p className="ps-upcoming__date">{longDate(session.startsAt)}</p>
          <p className="ps-upcoming__time">{shootHours(session)}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </header>
      <ul className="ps-upcoming__facts">
        <li>
          <img src={iconMapPin} width={16} height={16} alt="" />
          {session.location}
        </li>
        <li>
          <img src={iconPackage} width={16} height={16} alt="" />
          {itemCount(session.items)} to shoot
        </li>
        <li>
          <img src={iconUser} width={16} height={16} alt="" />
          Photographer: {session.photographer}
        </li>
      </ul>
      {onCancel && (
        <button type="button" className="ps-upcoming__cancel" onClick={onCancel}>
          Cancel request
        </button>
      )}
    </article>
  );
}

/** A past session with its first four photos; `full` adds the status badge and venue line used on Previous Sessions. */
export function SessionCard({ session, full }: { session: PhotoshootSession; full?: boolean }) {
  const status = photoshootStatusMeta[session.status];
  const editing = session.status === 'processing';
  return (
    <Link to={`/photoshoots/sessions/${session.id}`} className={`ps-session${full ? ' ps-session--full' : ''}`}>
      <div className="ps-session__head">
        <p className="ps-session__date">{longDate(session.startsAt)}</p>
        {full && <Badge tone={status.tone}>{status.label}</Badge>}
      </div>
      <p className="ps-session__meta">
        {itemCount(session.items)} • {editing ? 'photos in editing' : `${photoCount(session)} delivered`}
      </p>
      {editing ? (
        <div className="ps-session__pending">
          <strong>Editing in progress</strong>
          <span>Photos ready by {shortDate(session.readyBy ?? session.startsAt)}</span>
        </div>
      ) : (
        <div className="ps-session__thumbs">
          {session.photos.slice(0, 4).map((src) => (
            <img key={src} src={src} alt="" loading="lazy" />
          ))}
        </div>
      )}
      <div className="ps-session__foot">
        {full ? (
          <span>
            {session.kind === 'Studio' ? 'Studio session' : session.kind === 'Outdoor' ? 'Outdoor session' : 'On-location'} • {session.area}
          </span>
        ) : (
          <span className={`ps-session__status ps-session__status--${session.status}`}>{status.label}</span>
        )}
        <span className="ps-session__link">View Gallery</span>
      </div>
    </Link>
  );
}

const SLOTS = [
  { label: '9:00 AM – 2:00 PM', start: '09:00', end: '14:00' },
  { label: '11:00 AM – 4:00 PM', start: '11:00', end: '16:00' },
  { label: '1:00 PM – 6:00 PM', start: '13:00', end: '18:00' },
];

const VENUES = [
  { id: 'lagos', label: 'Losóde Studio, Lagos', kind: 'Studio', area: 'Lagos' },
  { id: 'ikeja', label: 'Losóde Studio, Ikeja', kind: 'Studio', area: 'Ikeja' },
  { id: 'onsite', label: 'On-location (your address)', kind: 'On-location' },
  { id: 'outdoor', label: 'Outdoor (choose a spot)', kind: 'Outdoor' },
] as const;

const isoDay = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const at = (day: string, time: string) => new Date(`${day}T${time}:00`).toISOString();

/** "Book New Photoshoot" button with its request form. */
export function BookShootButton({ packages, onBooked }: { packages: PhotoshootPackage[]; onBooked: (s: PhotoshootSession) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ps-book" onClick={() => setOpen(true)} disabled={packages.length === 0}>
        Book New Photoshoot
      </button>
      {open && (
        <BookShootDialog
          packages={packages}
          onClose={() => setOpen(false)}
          onBooked={(s) => {
            setOpen(false);
            onBooked(s);
          }}
        />
      )}
    </>
  );
}

function BookShootDialog({
  packages,
  onClose,
  onBooked,
}: {
  packages: PhotoshootPackage[];
  onClose: () => void;
  onBooked: (s: PhotoshootSession) => void;
}) {
  const { notify } = useSellerData();
  const [date, setDate] = useState(isoDay(14));
  const [slot, setSlot] = useState(0);
  const [venueId, setVenueId] = useState<(typeof VENUES)[number]['id']>('lagos');
  const [address, setAddress] = useState('');
  const [packageId, setPackageId] = useState(packages.find((p) => p.id === 'campaign')?.id ?? packages[0].id);
  const [items, setItems] = useState(5);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const venue = VENUES.find((v) => v.id === venueId)!;
  const pkg = packages.find((p) => p.id === packageId)!;
  const needsAddress = !('area' in venue);
  const soon = date < isoDay(14);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || date < isoDay(3)) return setError('Pick a date at least 3 days from today.');
    if (needsAddress && !address.trim()) return setError('Add the address for the shoot.');
    if (!Number.isInteger(items) || items < 1) return setError('Add at least one item to shoot.');
    if (items > pkg.looks) return setError(`${pkg.name} covers up to ${pkg.looks} items. Choose a bigger package or fewer items.`);
    setError(null);
    setSaving(true);
    try {
      const place = address.trim();
      const session = await api.bookPhotoshoot({
        startsAt: at(date, SLOTS[slot].start),
        endsAt: at(date, SLOTS[slot].end),
        packageId,
        kind: venue.kind,
        location: needsAddress ? `${venue.kind === 'Outdoor' ? 'Outdoor' : 'On-Location'}, ${place}` : venue.label,
        area: 'area' in venue ? venue.area : place.split(',')[0],
        items,
        notes: notes.trim() || undefined,
      });
      notify(`Shoot requested for ${longDate(session.startsAt)} — the studio will confirm within 24 hours`);
      onBooked(session);
    } catch {
      notify('Could not send the request — please try again');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="dialog dialog--wide" role="dialog" aria-modal="true" aria-labelledby="book-title">
        <h2 id="book-title" className="dialog__title">
          Book a photoshoot
        </h2>
        <form className="dialog__form" onSubmit={submit} noValidate>
          <div className="lf-row">
            <label className="lf-field">
              <span className="lf-label">Date</span>
              <input className="lf-input" type="date" min={isoDay(3)} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="lf-field">
              <span className="lf-label">Time</span>
              <select className="lf-input lf-select" value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
                {SLOTS.map((s, i) => (
                  <option key={s.label} value={i}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {soon && <p className="lf-hint">Shoots booked less than 2 weeks ahead may have fewer photographers available.</p>}
          <label className="lf-field">
            <span className="lf-label">Location</span>
            <select className="lf-input lf-select" value={venueId} onChange={(e) => setVenueId(e.target.value as typeof venueId)}>
              {VENUES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          {needsAddress && (
            <label className="lf-field">
              <span className="lf-label">Address</span>
              <input className="lf-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="E.g. Victoria Island, Lagos" />
            </label>
          )}
          <div className="lf-row">
            <label className="lf-field">
              <span className="lf-label">Package</span>
              <select className="lf-input lf-select" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {naira(p.price)}
                  </option>
                ))}
              </select>
            </label>
            <label className="lf-field">
              <span className="lf-label">Items to shoot</span>
              <input
                className="lf-input"
                type="number"
                min={1}
                max={pkg.looks}
                value={items || ''}
                onChange={(e) => setItems(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="lf-hint">
            {pkg.name}: up to {pkg.looks} items · {pkg.includes.join(' · ')}
          </p>
          <label className="lf-field">
            <span className="lf-label">Notes for the studio (optional)</span>
            <textarea className="lf-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Styling ideas, model preferences, items that need steaming…" />
          </label>
          {error && <p className="field__error">{error}</p>}
          <div className="dialog__actions">
            <button type="button" className="od-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="od-btn od-btn--dark" disabled={saving}>
              {saving ? 'Sending…' : `Request shoot · ${naira(pkg.price)}`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
