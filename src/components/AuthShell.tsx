import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { iconChevronLeftLg, iconChevronRightLg, iconEye, iconEyeOff, logoDark } from '../assets';

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

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LOSODE = 'https://www.losode.com';

/** Split layout shared by sign-in and sign-up: brand header, form, legal footer, and the editorial carousel. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="login">
      <section className="login__panel">
        <header className="login__brand">
          <img src={logoDark} width={158} height={53} alt="Losóde" />
          <span>SELLER PORTAL</span>
        </header>
        {children}
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
      <Carousel />
    </div>
  );
}

/** Password field with a show / hide toggle. */
export function PasswordInput({
  value,
  onChange,
  invalid,
  autoComplete,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  autoComplete: 'current-password' | 'new-password';
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <span className={`login__password${invalid ? ' is-invalid' : ''}`}>
      <input
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid}
      />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
        <img src={show ? iconEye : iconEyeOff} width={20} height={20} alt="" />
      </button>
    </span>
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
