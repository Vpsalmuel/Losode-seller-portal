import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthError } from '../api/client';
import { AuthShell, EMAIL_RE, LOSODE, PasswordInput } from '../components/AuthShell';
import { useAuth } from '../state/Auth';
import { useSellerData } from '../state/SellerData';
import { SocialButtons } from './Login';

type Field = 'fullName' | 'storeName' | 'email' | 'phone' | 'location' | 'password' | 'terms';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'A letter and a number', test: (p: string) => /[a-z]/i.test(p) && /\d/.test(p) },
  { label: 'A symbol, like ! or @', test: (p: string) => /[^a-z0-9]/i.test(p) },
];

export function Signup() {
  const { session } = useAuth();
  if (session) return <Navigate to="/" replace />;
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  );
}

function SignupForm() {
  const { signUp, signInWith } = useAuth();
  const { updateStore, notify } = useSellerData();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', storeName: '', email: '', phone: '', location: '', password: '' });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field | 'form', string>>>({});
  const [busy, setBusy] = useState<null | 'form' | 'google' | 'apple'>(null);

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  };

  const validate = () => {
    const found: typeof errors = {};
    if (!form.fullName.trim()) found.fullName = 'Enter your full name';
    if (!form.storeName.trim()) found.storeName = 'Enter the name customers will see';
    if (!EMAIL_RE.test(form.email.trim())) found.email = 'Enter a valid email address';
    if (form.phone.replace(/\D/g, '').length < 10) found.phone = 'Enter a phone number with its country code, e.g. +234';
    if (!form.location.trim()) found.location = 'Add your city and country';
    if (!PASSWORD_RULES.every((r) => r.test(form.password))) found.password = 'Choose a password that meets all three rules';
    if (!terms) found.terms = 'Accept the seller terms to continue';
    return found;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy('form');
    try {
      await signUp(form);
      const fullName = form.fullName.trim();
      // The mock store becomes the new seller's store for this visit.
      await updateStore({
        name: form.storeName.trim(),
        ownerFirstName: fullName.split(/\s+/)[0],
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        location: form.location.trim(),
      });
      notify(`Welcome to Losóde, ${fullName.split(/\s+/)[0]} — your seller account is ready`);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof AuthError ? err.message : 'Could not create your account. Please try again.' });
      setBusy(null);
    }
  };

  const social = async (provider: 'google' | 'apple') => {
    setBusy(provider);
    try {
      await signInWith(provider);
      navigate('/', { replace: true });
    } catch {
      setErrors({ form: `Could not continue with ${provider === 'google' ? 'Google' : 'Apple'}. Please try again.` });
      setBusy(null);
    }
  };

  const input = (key: Exclude<keyof typeof form, 'password'>, label: string, props: InputHTMLAttributes<HTMLInputElement>) => (
    <label className="login__field">
      <span>{label}</span>
      <input
        className={errors[key] ? 'is-invalid' : undefined}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={!!errors[key]}
        {...props}
      />
      {errors[key] && <em>{errors[key]}</em>}
    </label>
  );

  return (
    <form className="login__form" onSubmit={submit} noValidate>
      <div className="login__welcome">
        <p className="login__eyebrow">START SELLING</p>
        <h1>Create your store.</h1>
        <p className="login__lede">Join independent designers selling to style-led shoppers across Africa and the world.</p>
      </div>

      <div className="login__fields">
        {errors.form && (
          <p className="login__alert" role="alert">
            {errors.form}{' '}
            {errors.form.includes('already exists') && (
              <Link to="/login" className="login__alert-link">
                Go to sign in
              </Link>
            )}
          </p>
        )}
        <div className="login__row">
          {input('fullName', 'Full name', { autoComplete: 'name', placeholder: 'E.g. Amara Oke' })}
          {input('storeName', 'Store name', { autoComplete: 'organization', placeholder: 'E.g. Amara Atelier' })}
        </div>
        {input('email', 'Email address', { type: 'email', autoComplete: 'email', placeholder: 'Enter your email address' })}
        <div className="login__row">
          {input('phone', 'Phone number', { type: 'tel', autoComplete: 'tel', placeholder: '+234 800 000 0000' })}
          {input('location', 'Location', { autoComplete: 'address-level2', placeholder: 'Lagos, Nigeria' })}
        </div>
        <label className="login__field">
          <span>Password</span>
          <PasswordInput
            value={form.password}
            onChange={(v) => set('password', v)}
            invalid={!!errors.password}
            autoComplete="new-password"
            placeholder="Create a password"
          />
          <ul className="login__rules" aria-label="Password rules">
            {PASSWORD_RULES.map((r) => (
              <li key={r.label} className={r.test(form.password) ? 'is-met' : undefined}>
                {r.label}
              </li>
            ))}
          </ul>
          {errors.password && <em>{errors.password}</em>}
        </label>

        <label className="login__check login__check--terms">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked);
              setErrors((er) => ({ ...er, terms: undefined }));
            }}
          />
          <span />
          <p>
            I agree to the Losóde{' '}
            <a href={LOSODE} target="_blank" rel="noreferrer">
              Seller Terms
            </a>{' '}
            and{' '}
            <a href={LOSODE} target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            .
          </p>
        </label>
        {errors.terms && <em className="login__check-error">{errors.terms}</em>}

        <button type="submit" className="login__submit" disabled={busy !== null}>
          {busy === 'form' ? 'Creating your account…' : 'Create account'}
        </button>
      </div>

      <SocialButtons busy={busy} onSelect={social} />
      <p className="login__signup">
        Already selling on Losóde? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
