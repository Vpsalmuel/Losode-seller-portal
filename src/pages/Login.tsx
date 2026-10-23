import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, AuthError } from '../api/client';
import { iconApple, iconChevronLeftLg, iconChevronRightLg, iconEye, iconEyeOff, iconGoogle, logoDark } from '../assets';
import { useAuth } from '../state/Auth';

const SLIDE_MS = 6000;

const SLIDES = [
  {
    category: 'Dresses',
    image: '/login/dresses.jpg',
    thumb: '/login/dresses-thumb.jpg',
    heading: ['Extraordinary style.', 'Endless possibility.'],
    text: ['Exceptional fashion. Independent voices.', 'A world of possibility for your brand.'],
  },
  {
    category: 'Bags',
    image: '/login/bags.jpg',
    thumb: '/login/bags-thumb.jpg',
    heading: ['Crafted to carry.', 'Made to be noticed.'],
    text: ['From woven clutches to statement totes,', 'reach shoppers who notice every detail.'],
  },
  {
    category: 'Shoes',
    image: '/login/shoes.jpg',
    thumb: '/login/shoes-thumb.jpg',
    heading: ['Every step,', 'a statement.'],
    text: ['Show your footwear to style-led buyers', 'across Africa and around the world.'],
  },
  {
    category: 'Jewelry',
    image: '/login/jewelry.jpg',
    thumb: '/login/jewelry-thumb.jpg',
    heading: ['Small details.', 'Lasting impressions.'],
    text: ['Heirloom pieces and modern adornment,', 'discovered every day on Losóde.'],
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOSODE = 'https://www.losode.com';

export function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (session) return <Navigate to={from} replace />;

  return (
    <div className="login">
      <SignInPanel from={from} />
      <Carousel />
    </div>
  );
}

function SignInPanel({ from }: { from: string }) {
  const { signIn, signInWith } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'sign-in' | 'reset'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <section className="login__panel">
      <header className="login__brand">
        <img src={logoDark} width={158} height={53} alt="Losóde" />
        <span>SELLER PORTAL</span>
      </header>

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
                  <span className={`login__password${errors.password ? ' is-invalid' : ''}`}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      aria-invalid={!!errors.password}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      <img src={showPassword ? iconEye : iconEyeOff} width={20} height={20} alt="" />
                    </button>
                  </span>
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
            <div className="login__divider">
              <span>or continue with</span>
            </div>
            <div className="login__social">
              <button type="button" disabled={busy !== null} onClick={() => social('google')}>
                <img src={iconGoogle} width={20} height={20} alt="" />
                {busy === 'google' ? 'Connecting…' : 'Continue with Google'}
              </button>
              <button type="button" disabled={busy !== null} onClick={() => social('apple')}>
                <img src={iconApple} width={20} height={20} alt="" />
                {busy === 'apple' ? 'Connecting…' : 'Continue with Apple'}
              </button>
            </div>
            <p className="login__signup">
              New to Losóde?{' '}
              <a href={LOSODE} target="_blank" rel="noreferrer">
                Create an account
              </a>
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

      <footer className="login__footer">
        <span>© {new Date().getFullYear()} Losóde</span>
        <nav aria-label="Legal">
          <a href={LOSODE} target="_blank" rel="noreferrer">
            Privacy
          </a>
          <a href={LOSODE} target="_blank" rel="noreferrer">
            Terms
          </a>
          <a href={LOSODE} target="_blank" rel="noreferrer">
            Get help
          </a>
        </nav>
      </footer>
    </section>
  );
}

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** Auto-advancing editorial carousel; pauses while hovered or focused, and doesn't auto-play for reduced motion. */
function Carousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay] = useState(() => !prefersReducedMotion());
  // Time left on the current slide, so pausing and resuming picks up where the progress bar stopped.
  const remaining = useRef(SLIDE_MS);

  const go = useCallback((next: number) => setIndex((next + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    remaining.current = SLIDE_MS;
  }, [index]);

  useEffect(() => {
    if (!autoplay || paused) return;
    const started = Date.now();
    const timer = window.setTimeout(() => go(index + 1), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [index, paused, autoplay, go]);

  // Preload the full-size slides so cross-fades never show a blank frame.
  useEffect(() => {
    SLIDES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  const slide = SLIDES[index];
  const running = autoplay && !paused;

  return (
    <aside
      className="login__carousel"
      aria-roledescription="carousel"
      aria-label="The Losóde edit"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="login__story">
        {SLIDES.map((s, i) => (
          <img key={s.image} src={s.image} alt="" className={`login__slide${i === index ? ' is-active' : ''}`} />
        ))}
        <div className="login__scrim" />
        <p className="login__masthead">THE LOSÓDE EDIT</p>
        <div className="login__caption" aria-live={running ? 'off' : 'polite'}>
          <h2 key={`h-${index}`}>
            {slide.heading[0]}
            <br />
            {slide.heading[1]}
          </h2>
          <div className="login__caption-row">
            <p key={`p-${index}`}>
              {slide.text[0]}
              <br />
              {slide.text[1]}
            </p>
            <div className="login__arrows">
              <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide">
                <img src={iconChevronLeftLg} width={24} height={24} alt="" />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Next slide">
                <img src={iconChevronRightLg} width={24} height={24} alt="" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="login__collections">
        <p>A WORLD OF DISTINCTIVE FASHION</p>
        <div className="login__tabs" role="tablist" aria-label="Collections">
          {SLIDES.map((s, i) => (
            <button
              key={s.category}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`login__tab${i === index ? ' is-active' : ''}`}
              onClick={() => go(i)}
            >
              <img src={s.thumb} alt="" />
              <span className="login__tab-label">
                {s.category}
                {i === index && <small>{String(i + 1).padStart(2, '0')}</small>}
              </span>
              <span className="login__progress">
                {i === index && (
                  <span
                    key={index}
                    className={`login__progress-fill${!autoplay ? ' is-static' : running ? '' : ' is-paused'}`}
                    style={{ animationDuration: `${SLIDE_MS}ms` }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
