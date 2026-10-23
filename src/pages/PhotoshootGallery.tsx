import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PhotoshootSession } from '../api/types';
import { iconArrowLeftGreen } from '../assets';
import { itemCount, photoCount, usePhotoshoots } from '../components/photoshoot';
import { Loading, PageHeader, Pager } from '../components/ui';
import { longDate, shortDate } from '../lib/format';
import { buildZip, saveBlob } from '../lib/zip';
import { useSellerData } from '../state/SellerData';

const PAGE_SIZE = 12;

const fileName = (s: PhotoshootSession, i: number) => `losode-shoot-${s.startsAt.slice(0, 10)}-${String(i + 1).padStart(2, '0')}.jpg`;

export function PhotoshootGallery() {
  const { id } = useParams();
  const { sessions } = usePhotoshoots();
  if (!sessions) return <Loading />;
  const session = sessions.find((s) => s.id === id);
  if (!session) {
    return (
      <>
        <PageHeader title="Session not found" subtitle="It may have been cancelled." />
        <Link to="/photoshoots/sessions" className="back-link">
          ← Back to sessions
        </Link>
      </>
    );
  }
  return <Gallery session={session} />;
}

function Gallery({ session }: { session: PhotoshootSession }) {
  const { notify } = useSellerData();
  const [page, setPage] = useState(1);
  const [zipping, setZipping] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const photos = session.photos;
  const pageCount = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const visible = photos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const first = photos.length ? (page - 1) * PAGE_SIZE + 1 : 0;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Photoshoot · ${longDate(session.startsAt)}`, url });
      else {
        await navigator.clipboard.writeText(url);
        notify('Gallery link copied');
      }
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') notify('Could not share — copy the address bar link instead');
    }
  };

  const downloadAll = async () => {
    setZipping(true);
    try {
      const files = await Promise.all(
        photos.map(async (src, i) => {
          const res = await fetch(src);
          if (!res.ok) throw new Error(src);
          return { name: fileName(session, i), data: new Uint8Array(await res.arrayBuffer()) };
        }),
      );
      saveBlob(buildZip(files), `losode-shoot-${session.startsAt.slice(0, 10)}.zip`);
    } catch {
      notify('Could not prepare the download — please try again');
    } finally {
      setZipping(false);
    }
  };

  const emptyText =
    session.status === 'processing'
      ? `The studio is editing these photos. They'll be ready by ${shortDate(session.readyBy ?? session.startsAt)}.`
      : 'Photos will appear here after the shoot.';

  return (
    <div className="ps">
      <div className="ps-top">
        <Link to="/photoshoots/sessions" className="ps-back">
          <img src={iconArrowLeftGreen} width={14} height={14} alt="" />
          Back to Sessions
        </Link>
        <header className="page-header">
          <div>
            <h1 className="page-header__title">{longDate(session.startsAt)}</h1>
            <p className="ps-gallery__meta">
              {session.location} • {itemCount(session.items)} • {photos.length ? `${photoCount(session)} delivered` : 'photos in editing'}
            </p>
          </div>
          <div className="page-header__actions ps-gallery__actions">
            <button type="button" className="ps-btn" onClick={share}>
              Share Gallery
            </button>
            <button type="button" className="ps-btn ps-btn--dark" disabled={!photos.length || zipping} onClick={downloadAll}>
              {zipping ? 'Preparing…' : 'Download All (.ZIP)'}
            </button>
          </div>
        </header>
      </div>

      {photos.length > 0 ? (
        <div className="ps-photos">
          {visible.map((src, i) => {
            const index = (page - 1) * PAGE_SIZE + i;
            return (
              <button key={src} type="button" className="ps-photo" onClick={() => setOpen(index)} aria-label={`Open photo ${index + 1}`}>
                <img src={src} alt="" loading="lazy" />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="ps-empty ps-empty--box">{emptyText}</p>
      )}

      {photos.length > 0 && (
        <div className="ps-pagination">
          <span>
            Showing {first}-{Math.min(page * PAGE_SIZE, photos.length)} of {photos.length} images
          </span>
          <Pager page={page} pageCount={pageCount} onChange={setPage} label="Gallery pages" large />
        </div>
      )}

      {open !== null && <Lightbox session={session} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Lightbox({ session, index, onChange, onClose }: { session: PhotoshootSession; index: number; onChange: (i: number) => void; onClose: () => void }) {
  const count = session.photos.length;
  const go = useCallback((step: number) => onChange((index + step + count) % count), [index, count, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  return (
    <div className="ps-lightbox" role="dialog" aria-modal="true" aria-label={`Photo ${index + 1} of ${count}`} onClick={onClose}>
      <div className="ps-lightbox__bar" onClick={(e) => e.stopPropagation()}>
        <span>
          {index + 1} / {count}
        </span>
        <a className="ps-btn" href={session.photos[index]} download={fileName(session, index)}>
          Download
        </a>
        <button type="button" className="ps-lightbox__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <button type="button" className="ps-lightbox__nav ps-lightbox__nav--prev" aria-label="Previous photo" onClick={(e) => (e.stopPropagation(), go(-1))}>
        ‹
      </button>
      <img src={session.photos[index]} alt={`Photo ${index + 1}`} onClick={(e) => e.stopPropagation()} />
      <button type="button" className="ps-lightbox__nav ps-lightbox__nav--next" aria-label="Next photo" onClick={(e) => (e.stopPropagation(), go(1))}>
        ›
      </button>
    </div>
  );
}
