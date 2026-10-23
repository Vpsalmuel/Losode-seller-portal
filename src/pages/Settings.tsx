import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Store } from '../api/types';
import { Loading, PageHeader } from '../components/ui';
import { storeUrl } from '../lib/format';
import { useSellerData } from '../state/SellerData';

export function Settings() {
  const { loading, store } = useSellerData();
  if (loading || !store) return <Loading />;
  return <SettingsForm initial={store} />;
}

type ProfileField = Exclude<keyof Store, 'ownerFirstName' | 'slug' | 'bankName' | 'accountNumber' | 'accountName'>;
type Errors = Partial<Record<ProfileField, string>>;

const IMAGE_LIMITS = { logo: 2 * 1024 * 1024, banner: 5 * 1024 * 1024 };

/** Strips a pasted profile URL or leading @ down to the bare handle. */
const handle = (value: string) => value.trim().replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?(instagram|twitter|x)\.com\//i, '').replace(/\/+$/, '');

function validate(f: Store): Errors {
  const errors: Errors = {};
  if (!f.name.trim()) errors.name = 'Your store needs a name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'Enter a valid email address';
  if (f.phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a phone number with its country code, e.g. +234';
  if (!f.location.trim()) errors.location = 'Add your city and country';
  for (const key of ['instagram', 'twitter'] as const) {
    if (f[key] && !/^[A-Za-z0-9._]{1,30}$/.test(f[key])) errors[key] = 'Use letters, numbers, dots or underscores only';
  }
  if (f.website && !/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(f.website)) errors.website = 'Enter a domain like yourbrand.com';
  return errors;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="st-field">
      <span className="st-label">{label}</span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

function SettingsForm({ initial }: { initial: Store }) {
  const { updateStore, notify } = useSellerData();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends ProfileField>(key: K, value: Store[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const pickImage = (key: 'logo' | 'banner', file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type)) return notify('Use a PNG or JPG image');
    if (file.size > IMAGE_LIMITS[key]) return notify(key === 'logo' ? 'Logos must be 2 MB or smaller' : 'Banners must be 5 MB or smaller');
    // A data URL stands in for the uploaded file until the real upload API is wired up.
    const reader = new FileReader();
    reader.onload = () => set(key, reader.result as string);
    reader.onerror = () => notify('Could not read that file');
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const next: Store = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      instagram: handle(form.instagram),
      twitter: handle(form.twitter),
      website: form.website.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, ''),
    };
    setForm(next);
    const found = validate(next);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector('.st .field__error')?.closest('.st-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }
    setSaving(true);
    try {
      await updateStore(next);
      notify('Store settings saved');
    } catch {
      notify('Could not save — please try again');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${storeUrl(initial)}`);
      notify('Store link copied');
    } catch {
      notify(`Copy failed — your link is ${storeUrl(initial)}`);
    }
  };

  return (
    <div className="st">
      <PageHeader
        title="Store Settings"
        subtitle="Configure your brand profile, policies, contact info, and socials."
        actions={
          <>
            {dirty && (
              <button type="button" className="st-discard" disabled={saving} onClick={() => (setForm(initial), setErrors({}))}>
                Discard
              </button>
            )}
            <button type="button" className="st-save" disabled={!dirty || saving} onClick={save}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      />

      <div className="st-grid">
        <div className="st-col">
          <section className="st-card">
            <h2 className="st-card__title">Store Profile</h2>
            <Field label="Store Name" error={errors.name}>
              <input className={`st-input${errors.name ? ' is-invalid' : ''}`} value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Store Description">
              <textarea className="st-input st-textarea" value={form.description} maxLength={300} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <div className="st-upload">
              <img className="st-upload__logo" src={form.logo} alt="Store logo" />
              <div className="st-upload__text">
                <p>Store Logo</p>
                <span>PNG or JPG up to 2MB</span>
              </div>
              <button type="button" className="st-upload__btn" onClick={() => logoInput.current?.click()}>
                Change Logo
              </button>
              <input ref={logoInput} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => (pickImage('logo', e.target.files?.[0]), (e.target.value = ''))} />
            </div>
            <div className="st-upload st-upload--banner">
              <img className="st-upload__banner" src={form.banner} alt="Store banner" />
              <div className="st-upload__stack">
                <div className="st-upload__text">
                  <p>Store Banner</p>
                  <span>Recommended size: 1200x400px</span>
                </div>
                <button type="button" className="st-upload__btn st-upload__btn--strong" onClick={() => bannerInput.current?.click()}>
                  Upload Banner
                </button>
              </div>
              <input ref={bannerInput} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => (pickImage('banner', e.target.files?.[0]), (e.target.value = ''))} />
            </div>
          </section>

          <section className="st-card">
            <h2 className="st-card__title">Store Policies</h2>
            <Field label="Return Policy">
              <textarea className="st-input st-textarea" value={form.returnPolicy} onChange={(e) => set('returnPolicy', e.target.value)} />
            </Field>
            <Field label="Shipping Policy">
              <textarea className="st-input st-textarea" value={form.shippingPolicy} onChange={(e) => set('shippingPolicy', e.target.value)} />
            </Field>
          </section>
        </div>

        <div className="st-col">
          <section className="st-card">
            <h2 className="st-card__title">Contact &amp; Location</h2>
            <Field label="Support Email" error={errors.email}>
              <input className={`st-input${errors.email ? ' is-invalid' : ''}`} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Phone Number" error={errors.phone}>
              <input className={`st-input${errors.phone ? ' is-invalid' : ''}`} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Location" error={errors.location}>
              <input className={`st-input${errors.location ? ' is-invalid' : ''}`} value={form.location} onChange={(e) => set('location', e.target.value)} />
            </Field>
          </section>

          <section className="st-card">
            <h2 className="st-card__title">Social Links</h2>
            {(
              [
                ['instagram', 'Instagram', 'instagram.com/'],
                ['twitter', 'Twitter / X', 'twitter.com/'],
                ['website', 'Website URL', 'https://'],
              ] as const
            ).map(([key, label, prefix]) => (
              <Field key={key} label={label} error={errors[key]}>
                <span className={`st-input st-prefixed${errors[key] ? ' is-invalid' : ''}`}>
                  <span>{prefix}</span>
                  <input value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={key === 'website' ? 'yourbrand.com' : 'yourhandle'} />
                </span>
              </Field>
            ))}
          </section>

          <section className="st-card st-card--url">
            <h2 className="st-card__title">Your Store URL</h2>
            <p>This is the public URL customers use to view your catalog directly on the Losóde marketplace.</p>
            <div className="st-url">
              <a href={`https://${storeUrl(initial)}`} target="_blank" rel="noreferrer">
                {storeUrl(initial)}
              </a>
              <button type="button" onClick={copyLink}>
                Copy Link
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
