import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, AuthError } from '../api/client';
import { demoAccount } from '../api/mockData';
import { iconApple, iconGoogle } from '../assets';
import { AuthShell, EMAIL_RE, PasswordInput } from '../components/AuthShell';
import { useAuth } from '../state/Auth';

export function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (session) return <Navigate to={from} replace />;

  return (
    <AuthShell>
      <SignInForm from={from} />
    </AuthShell>
  );
}

/** Google / Apple buttons, shared with the sign-up page. */
export function SocialButtons({ busy, onSelect }: { busy: string | null; onSelect: (p: 'google' | 'apple') => void }) {
  return (
    <>
      <div className="login__divider">
        <span>or continue with</span>
      </div>
      <div className="login__social">
        <button type="button" disabled={busy !== null} onClick={() => onSelect('google')}>
          <img src={iconGoogle} width={20} height={20} alt="" />
          {busy === 'google' ? 'Connecting…' : 'Continue with Google'}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => onSelect('apple')}>
          <img src={iconApple} width={20} height={20} alt="" />
          {busy === 'apple' ? 'Connecting…' : 'Continue with Apple'}
        </button>
      </div>
    </>
  );
}

function SignInForm({ from }: { from: string }) {
  const { signIn, signInWith } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'sign-in' | 'reset'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState<null | 'password' | 'google' | 'apple' | 'reset'>(null);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) found.email = 'Enter the email address you sell with';
    if (mode === 'sign-in' && !password) found.password = 'Enter your password';
    setErrors(found);
    if (Object.keys(found).length) return;

    if (mode === 'reset') {
      setBusy('reset');
      await api.requestPasswordReset(email.trim());
      setBusy(null);
      setResetSent(true);
      return;
    }

    setBusy('password');
    try {
      await signIn(email, password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof AuthError ? err.message : 'Something went wrong. Please try again.' });
      setBusy(null);
    }
  };

  const social = async (provider: 'google' | 'apple') => {
    setBusy(provider);
    try {
      await signInWith(provider);
      navigate(from, { replace: true });
    } catch {
      setErrors({ form: `Could not sign in with ${provider === 'google' ? 'Google' : 'Apple'}. Please try again.` });
      setBusy(null);
    }
  };

  const switchMode = (next: 'sign-in' | 'reset') => {
    setMode(next);
    setErrors({});
    setResetSent(false);
  };

  return (
    <form className="login__form" onSubmit={submit} noValidate>
      {mode === 'sign-in' ? (
        <div className="login__welcome">
          <p className="login__eyebrow">YOUR NEXT CHAPTER</p>
          <h1>Welcome back.</h1>
          <p className="login__lede">Sign in to manage your store and bring your next collection to the world.</p>
        </div>
      ) : (
        <div className="login__welcome">
          <p className="login__eyebrow">RESET PASSWORD</p>
          <h1>Forgot your password?</h1>
          <p className="login__lede">Enter the email address on your seller account and we'll send you a link to set a new one.</p>
        </div>
      )}

      {resetSent ? (
        <div className="login__notice" role="status">
          If <strong>{email.trim()}</strong> has a seller account, a reset link is on its way.
        </div>
      ) : (
        <div className="login__fields">
          {mode === 'sign-in' && (
            <div className="login__demo">
              <span>
                Demo account: <strong>{demoAccount.email}</strong> / <strong>{demoAccount.password}</strong>
              </span>
              <button
                type="button"
                className="login__link"
                onClick={() => {
                  setEmail(demoAccount.email);
                  setPassword(demoAccount.password);
                  setErrors({});
                }}
              >
                Use it
              </button>
            </div>
          )}
          {errors.form && (
            <p className="login__alert" role="alert">
              {errors.form}
            </p>
          )}
          <label className="login__field">
            <span>Email address</span>
            <input
              className={errors.email ? 'is-invalid' : undefined}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-invalid={!!errors.email}
            />
            {errors.email && <em>{errors.email}</em>}
          </label>

          {mode === 'sign-in' && (
            <>
              <label className="login__field">
                <span>Password</span>
                <PasswordInput value={password} onChange={setPassword} invalid={!!errors.password} autoComplete="current-password" placeholder="Enter your password" />
                {errors.password && <em>{errors.password}</em>}
              </label>

              <div className="login__prefs">
                <label className="login__check">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span />
                  Remember me
                </label>
                <button type="button" className="login__link" onClick={() => switchMode('reset')}>
                  Forgot password?
                </button>
              </div>
            </>
          )}

          <button type="submit" className="login__submit" disabled={busy !== null}>
            {mode === 'reset' ? (busy === 'reset' ? 'Sending…' : 'Send reset link') : busy === 'password' ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      )}

      {mode === 'sign-in' ? (
        <>
          <SocialButtons busy={busy} onSelect={social} />
          <p className="login__signup">
            New to Losóde? <Link to="/signup">Create an account</Link>
          </p>
        </>
      ) : (
        <p className="login__signup">
          Remembered it?{' '}
          <button type="button" className="login__link" onClick={() => switchMode('sign-in')}>
            Back to sign in
          </button>
        </p>
      )}
    </form>
  );
}
