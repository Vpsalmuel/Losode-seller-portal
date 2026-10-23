import { Link, useSearchParams } from 'react-router-dom';
import { iconSortDown } from '../assets';
import { BookShootButton, SessionCard, isUpcoming, usePhotoshoots } from '../components/photoshoot';
import { Loading, PageHeader, Pager } from '../components/ui';

const PAGE_SIZE = 6;

const DATE_RANGES = [
  { id: 'all', label: 'All Time', days: Infinity },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 3 months', days: 91 },
  { id: '180d', label: 'Last 6 months', days: 182 },
];

const STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'processing', label: 'Editing' },
];

function Filter({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="ps-filter">
      <span>{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PhotoshootSessions() {
  const { sessions, setSessions, packages } = usePhotoshoots();
  const [params, setParams] = useSearchParams();
  if (!sessions) return <Loading />;

  const range = params.get('date') ?? 'all';
  const status = params.get('status') ?? 'all';
  const model = params.get('model') ?? 'all';
  const oldestFirst = params.get('sort') === 'oldest';

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === 'all' || (key === 'sort' && value === 'latest')) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const past = sessions.filter((s) => !isUpcoming(s));
  const models = [...new Set(past.flatMap((s) => s.models))].sort();
  const maxAge = DATE_RANGES.find((r) => r.id === range)?.days ?? Infinity;
  const now = Date.now();
  const filtered = past
    .filter((s) => (now - new Date(s.startsAt).getTime()) / 86_400_000 <= maxAge)
    .filter((s) => status === 'all' || s.status === status)
    .filter((s) => model === 'all' || s.models.includes(model))
    .sort((a, b) => (oldestFirst ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt)));

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number(params.get('page')) || 1));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const first = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const filtering = range !== 'all' || status !== 'all' || model !== 'all';

  return (
    <div className="ps">
      <div className="ps-top">
        <nav className="ps-crumbs" aria-label="Breadcrumb">
          <Link to="/photoshoots">Photoshoots</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Previous Sessions</span>
        </nav>
        <PageHeader
          title="Previous Sessions"
          subtitle="Explore and download visual assets from your past fashion marketplace shoots."
          actions={<BookShootButton packages={packages} onBooked={(s) => setSessions((all) => [s, ...(all ?? [])])} />}
        />
      </div>

      <div className="ps-controls">
        <div className="ps-filters">
          <Filter label="Date" value={range} options={DATE_RANGES} onChange={(v) => update('date', v)} />
          <Filter label="Status" value={status} options={STATUSES} onChange={(v) => update('status', v)} />
          <Filter
            label="Model"
            value={model}
            options={[{ id: 'all', label: 'All Models' }, ...models.map((m) => ({ id: m, label: m }))]}
            onChange={(v) => update('model', v)}
          />
        </div>
        <button type="button" className="ps-sort" onClick={() => update('sort', oldestFirst ? 'latest' : 'oldest')}>
          <span>Sort by:</span> {oldestFirst ? 'Oldest First' : 'Latest First'}
          <img src={iconSortDown} width={14} height={14} alt="" className={oldestFirst ? 'is-flipped' : undefined} />
        </button>
      </div>

      {visible.length > 0 ? (
        <div className="ps-grid ps-grid--rows">
          {visible.map((s) => (
            <SessionCard key={s.id} session={s} full />
          ))}
        </div>
      ) : (
        <div className="ps-empty ps-empty--box">
          {filtering ? 'No sessions match these filters.' : 'No previous sessions yet.'}
          {filtering && (
            <button type="button" className="od-link" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="ps-pagination">
        <span>
          Showing {first}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} sessions
        </span>
        <Pager page={page} pageCount={pageCount} onChange={(n) => update('page', String(n))} label="Session pages" large />
      </div>
    </div>
  );
}
