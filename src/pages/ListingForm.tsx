import { useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ListingInput, ListingStatus } from '../api/types';
import { iconDocumentUpload } from '../assets';
import { Loading, PageHeader, TodayChip } from '../components/ui';
import { CATEGORIES, COLOURS, FITS, MAX_IMAGE_BYTES, MAX_IMAGES, OCCASIONS, SIZES } from '../lib/catalog';
import { listingToInput } from '../lib/format';
import { useSellerData } from '../state/SellerData';

const FIRST_CATEGORY = Object.keys(CATEGORIES)[0];

const EMPTY: ListingInput = {
  name: '',
  category: FIRST_CATEGORY,
  subCategory: CATEGORIES[FIRST_CATEGORY][0],
  price: 0,
  stock: 0,
  status: 'draft',
  sizes: [],
  colours: [],
  description: '',
  images: [],
  occasions: [],
  fit: FITS[0],
  deliveryEstimate: '3 - 5 days',
};

type ErrorKey = 'name' | 'description' | 'price' | 'stock' | 'images' | 'sizes' | 'discount' | 'dates' | 'sizeGuideUrl';
type Errors = Partial<Record<ErrorKey, string>>;

function validate(form: ListingInput, publishing: boolean): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = 'Give your product a name';
  if (publishing && !form.description.trim()) errors.description = 'Describe the product for shoppers';
  if (!(form.price > 0)) errors.price = 'Enter a price above ₦0';
  if (form.stock < 0 || !Number.isInteger(form.stock)) errors.stock = 'Stock must be a whole number';
  else if (publishing && form.stock === 0) errors.stock = 'Add stock before publishing';
  if (publishing && !form.images?.length && !form.coverImage) errors.images = 'Add at least one photo before publishing';
  if (publishing && form.sizes.length === 0) errors.sizes = 'Pick at least one size';

  const hasDates = !!(form.discountFrom || form.discountUntil);
  if (form.discountPercent !== undefined) {
    if (!Number.isInteger(form.discountPercent) || form.discountPercent < 1 || form.discountPercent > 90)
      errors.discount = 'Use a whole percentage between 1 and 90';
  } else if (hasDates) {
    errors.discount = 'Enter a discount value, or clear the dates';
  }
  if (form.discountFrom && form.discountUntil && form.discountUntil < form.discountFrom)
    errors.dates = '"Valid Until" must be on or after "Valid From"';

  if (form.sizeGuideUrl) {
    try {
      const url = new URL(form.sizeGuideUrl);
      if (!/^https?:$/.test(url.protocol)) throw new Error();
    } catch {
      errors.sizeGuideUrl = 'Paste a full link starting with https://';
    }
  }
  return errors;
}

export function ListingForm() {
  const { id } = useParams();
  const { loading, listings } = useSellerData();
  if (loading) return <Loading />;

  const existing = id ? listings.find((l) => l.id === id) : undefined;
  if (id && !existing) {
    return (
      <>
        <PageHeader title="Listing not found" subtitle="It may have been removed." />
        <Link to="/listings" className="back-link">
          ← Back to listings
        </Link>
      </>
    );
  }

  let initial = EMPTY;
  if (existing) {
    initial = listingToInput(existing);
    if (!initial.images?.length && initial.image) initial.images = [initial.image];
  }

  // Keyed so switching between listings resets the form state.
  return <ListingFormInner key={id ?? 'new'} id={id} initial={initial} />;
}

function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`lf-field${className ? ` ${className}` : ''}`}>
      <span className="lf-label">{label}</span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

function ListingFormInner({ id, initial }: { id?: string; initial: ListingInput }) {
  const { saveListing, notify } = useSellerData();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [allColours, setAllColours] = useState(() =>
    initial.colours.some((c) => COLOURS.find((s) => s.name === c && !s.primary)),
  );

  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key: 'sizes' | 'colours' | 'occasions', value: string) =>
    setForm((f) => {
      const list = f[key] ?? [];
      return { ...f, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  const images = form.images ?? [];
  // Keep sizes saved on older listings (e.g. shoe sizes) selectable.
  const sizeOptions = [...SIZES, ...form.sizes.filter((s) => !SIZES.includes(s))];
  const swatches = allColours ? COLOURS : COLOURS.filter((c) => c.primary || form.colours.includes(c.name));

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    const accepted = [...files].filter((f) => f.type.startsWith('image/') && f.size <= MAX_IMAGE_BYTES);
    if (accepted.length < files.length) notify('Some files were skipped — use images under 25 MB');
    if (room <= 0) {
      notify(`You can add up to ${MAX_IMAGES} photos`);
      return;
    }
    if (accepted.length > room) notify(`Only the first ${room} photo${room === 1 ? '' : 's'} were added (max ${MAX_IMAGES})`);
    // Data URLs stand in for uploaded file URLs until the real upload API is wired up.
    Promise.all(
      accepted.slice(0, room).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((urls) => {
        setForm((f) => ({ ...f, images: [...(f.images ?? []), ...urls] }));
        setErrors((e) => ({ ...e, images: undefined }));
      })
      .catch(() => notify('Could not read that file'));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const submit = async (status: ListingStatus) => {
    const next: ListingInput = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      material: form.material?.trim() || undefined,
      careInstructions: form.careInstructions?.trim() || undefined,
      sizeGuideUrl: form.sizeGuideUrl?.trim() || undefined,
      image: images[0],
      status,
    };
    const found = validate(next, status === 'active');
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() =>
        document.querySelector('.field__error')?.closest('.lf-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
      return;
    }

    setSaving(true);
    try {
      await saveListing(next, id);
      notify(status === 'active' ? `${next.name} is live in your storefront` : `${next.name} saved as draft`);
      navigate('/listings');
    } catch {
      notify('Could not save — please try again');
      setSaving(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit('active');
  };

  return (
    <>
      <PageHeader
        title={id ? 'Edit Listing' : 'List a New Item'}
        subtitle={id ? `Update ${initial.name} in your Losóde catalog` : 'Create and upload a new product listing to the Losóde catalog'}
        actions={<TodayChip />}
      />

      <form className="lf" onSubmit={onSubmit} noValidate>
        <div className="lf-col lf-col--main">
          <section className="lf-card">
            <h2 className="lf-card__title">Product Details</h2>
            <Field label="Product Name *" error={errors.name}>
              <input
                className={`lf-input${errors.name ? ' is-invalid' : ''}`}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="E.g. Ankara Floral Wrap Midi Dress"
              />
            </Field>
            <Field label="Description *" error={errors.description}>
              <textarea
                className={`lf-input lf-textarea${errors.description ? ' is-invalid' : ''}`}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Provide a detailed overview of the dress style, fit, artisan material components, and washing guidelines..."
              />
            </Field>
            <div className="lf-row">
              <Field label="Category *">
                <select
                  className="lf-input lf-select"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: CATEGORIES[e.target.value]?.[0] }))}
                >
                  {Object.keys(CATEGORIES).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Sub-Category">
                <select className="lf-input lf-select" value={form.subCategory ?? ''} onChange={(e) => set('subCategory', e.target.value || undefined)}>
                  <option value="">None</option>
                  {(CATEGORIES[form.category] ?? []).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="lf-card">
            <h2 className="lf-card__title">Pricing &amp; Inventory</h2>
            <div className="lf-row lf-row--price">
              <Field label="Price (₦) *" error={errors.price}>
                <input
                  className={`lf-input${errors.price ? ' is-invalid' : ''}`}
                  inputMode="numeric"
                  value={form.price ? `₦${form.price.toLocaleString('en-NG')}` : ''}
                  onChange={(e) => set('price', Number(e.target.value.replace(/\D/g, '')))}
                  placeholder="₦45,000"
                />
              </Field>
              <Field label="Stock Quantity *" error={errors.stock}>
                <input
                  className={`lf-input${errors.stock ? ' is-invalid' : ''}`}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={!id && form.stock === 0 ? '' : form.stock}
                  onChange={(e) => set('stock', Number(e.target.value))}
                  placeholder="15"
                />
              </Field>
            </div>
          </section>

          <section className="lf-card">
            <h2 className="lf-card__title">Discount</h2>
            <Field label="Discount Value" error={errors.discount}>
              <div className="lf-suffix">
                <input
                  className={`lf-input${errors.discount ? ' is-invalid' : ''}`}
                  inputMode="numeric"
                  value={form.discountPercent ?? ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    set('discountPercent', digits ? Number(digits) : undefined);
                  }}
                  placeholder="E.g. 15"
                />
                <span>% off</span>
              </div>
            </Field>
            <div className="lf-row">
              <Field label="Valid From">
                <input
                  className={`lf-input lf-date${form.discountFrom ? '' : ' is-empty'}`}
                  type="date"
                  value={form.discountFrom ?? ''}
                  onChange={(e) => set('discountFrom', e.target.value || undefined)}
                />
              </Field>
              <Field label="Valid Until" error={errors.dates}>
                <input
                  className={`lf-input lf-date${form.discountUntil ? '' : ' is-empty'}${errors.dates ? ' is-invalid' : ''}`}
                  type="date"
                  min={form.discountFrom}
                  value={form.discountUntil ?? ''}
                  onChange={(e) => set('discountUntil', e.target.value || undefined)}
                />
              </Field>
            </div>
            <p className="lf-hint">Leave empty if no discount applies</p>
          </section>

          <section className="lf-card">
            <h2 className="lf-card__title">Material &amp; Care</h2>
            <Field label="Material/Fabric">
              <input
                className="lf-input"
                value={form.material ?? ''}
                onChange={(e) => set('material', e.target.value)}
                placeholder="E.g. 100% Ankara Cotton"
              />
            </Field>
            <Field label="Care Instructions">
              <textarea
                className="lf-input lf-textarea"
                value={form.careInstructions ?? ''}
                onChange={(e) => set('careInstructions', e.target.value)}
                placeholder="E.g. Hand wash cold, hang dry, iron on low heat"
              />
            </Field>
          </section>
        </div>

        <div className="lf-col lf-col--side">
          <section className="lf-card lf-card--side">
            <h2 className="lf-card__title lf-card__title--sm">Product Images</h2>
            <div
              className={`lf-drop${dragging ? ' is-dragging' : ''}${errors.images ? ' is-invalid' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fileInput.current?.click())}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <span className="lf-drop__icon">
                <img src={iconDocumentUpload} width={24} height={24} alt="" />
              </span>
              <span className="lf-drop__text">
                <strong>Click to Upload</strong> or drag and drop
              </span>
              <span className="lf-drop__hint">(Max. File size: 25 MB)</span>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="lf-thumbs">
              {Array.from({ length: MAX_IMAGES }, (_, i) =>
                images[i] ? (
                  <div key={i} className="lf-thumb">
                    <img src={images[i]} alt={i === 0 ? 'Main photo' : `Photo ${i + 1}`} />
                    {i === 0 && <span className="lf-thumb__main">Main</span>}
                    <button
                      type="button"
                      className="lf-thumb__remove"
                      aria-label={`Remove photo ${i + 1}`}
                      onClick={() => set('images', images.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button key={i} type="button" className="lf-thumb lf-thumb--empty" aria-label="Add photo" onClick={() => fileInput.current?.click()}>
                    +
                  </button>
                ),
              )}
            </div>
            {errors.images && <span className="field__error">{errors.images}</span>}
          </section>

          <section className="lf-card lf-card--side">
            <h2 className="lf-card__title lf-card__title--sm">Sizing &amp; Variants</h2>
            <p className="lf-sublabel">Size Options</p>
            <div className="lf-sizes" role="group" aria-label="Size options">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`lf-size${form.sizes.includes(size) ? ' is-selected' : ''}`}
                  aria-pressed={form.sizes.includes(size)}
                  onClick={() => {
                    toggle('sizes', size);
                    setErrors((e) => ({ ...e, sizes: undefined }));
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
            {errors.sizes && <span className="field__error">{errors.sizes}</span>}
            <p className="lf-sublabel">Color Variants</p>
            <div className="lf-swatches" role="group" aria-label="Colour variants">
              {swatches.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`lf-swatch${form.colours.includes(c.name) ? ' is-selected' : ''}`}
                  style={{ background: c.fill }}
                  aria-pressed={form.colours.includes(c.name)}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => toggle('colours', c.name)}
                />
              ))}
              <button type="button" className="lf-link" onClick={() => setAllColours((v) => !v)}>
                {allColours ? 'show less' : 'show all'}
              </button>
            </div>
          </section>

          <section className="lf-card lf-card--side">
            <h2 className="lf-card__title">Occasion &amp; Style</h2>
            <div className="lf-occasions" role="group" aria-label="Occasion and style">
              {OCCASIONS.map((o) => {
                const on = form.occasions?.includes(o) ?? false;
                return (
                  <button key={o} type="button" className={`lf-occasion${on ? ' is-selected' : ''}`} aria-pressed={on} onClick={() => toggle('occasions', o)}>
                    {o}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lf-card lf-card--side">
            <h2 className="lf-card__title">Size &amp; Fit</h2>
            <Field label="Fit Type">
              <select className="lf-input lf-select" value={form.fit ?? FITS[0]} onChange={(e) => set('fit', e.target.value)}>
                {FITS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Size Guide Link" error={errors.sizeGuideUrl}>
              <input
                className={`lf-input${errors.sizeGuideUrl ? ' is-invalid' : ''}`}
                type="url"
                value={form.sizeGuideUrl ?? ''}
                onChange={(e) => set('sizeGuideUrl', e.target.value)}
                placeholder="Paste URL to size guide"
              />
            </Field>
          </section>

          <section className="lf-card lf-card--side">
            <h2 className="lf-card__title lf-card__title--sm">Delivery &amp; Shipping</h2>
            <Field label="Estimated Delivery (Days)" className="lf-field--compact">
              <input
                className="lf-input lf-input--compact"
                value={form.deliveryEstimate ?? ''}
                onChange={(e) => set('deliveryEstimate', e.target.value)}
                placeholder="3 - 5 days"
              />
            </Field>
          </section>
        </div>

        <div className="lf-actions">
          <Link to="/listings" className="btn btn--ghost btn--md">
            Cancel
          </Link>
          <span className="lf-actions__spacer" />
          <button type="button" className="btn btn--ghost btn--md" disabled={saving} onClick={() => submit('draft')}>
            Save as Draft
          </button>
          <button type="submit" className="btn btn--brand btn--md" disabled={saving}>
            {id ? 'Save & Publish' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </>
  );
}
