import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  avatar,
  iconAnalytics,
  iconArrowDown,
  iconCamera,
  iconDashboard,
  iconListings,
  iconNotificationBell,
  iconOrders,
  iconPayments,
  iconSettings,
  logoDark,
  logoWhite,
} from '../assets';
import { storeUrl } from '../lib/format';
import { useAuth } from '../state/Auth';
import { useSellerData } from '../state/SellerData';

const navClass = ({ isActive }: { isActive: boolean }) => `nav__item${isActive ? ' is-active' : ''}`;
const subNavClass = ({ isActive }: { isActive: boolean }) => `nav__subitem${isActive ? ' is-active' : ''}`;

function NavIcon({ src }: { src: string }) {
  return <img src={src} width={18} height={18} alt="" />;
}

function ProfileMenu() {
  const { store } = useSellerData();
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="profile-menu" ref={ref}>
      <button
        type="button"
        className="profile-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <img src={avatar} width={29} height={29} alt="" className="profile-menu__avatar" />
        <span className="profile-menu__name">{store?.name ?? 'Your store'}</span>
        <img src={iconArrowDown} width={12} height={12} alt="" />
      </button>
      {open && (
        <div className="profile-menu__list" role="menu">
          <p className="profile-menu__role">Seller Account</p>
          {session && <p className="profile-menu__email">{session.email}</p>}
          <Link to="/settings" role="menuitem">
            Store settings
          </Link>
          <Link to="/payments" role="menuitem">
            My payments
          </Link>
          {store && (
            <a href={`https://${storeUrl(store)}`} target="_blank" rel="noreferrer" role="menuitem">
              View storefront
            </a>
          )}
          <button type="button" role="menuitem" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { pendingOrders, toast } = useSellerData();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="shell">
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar${menuOpen ? ' is-open' : ''}`}>
        <Link to="/" className="sidebar__logo" aria-label="Losóde dashboard home">
          <img src={logoWhite} width={146} height={49} alt="Losóde" />
        </Link>
        <nav className="nav" aria-label="Seller navigation">
          <NavLink to="/" end className={navClass}>
            <NavIcon src={iconDashboard} />
            Dashboard
          </NavLink>
          <NavLink to="/orders" className={navClass}>
            <NavIcon src={iconOrders} />
            Manage Orders
            {pendingOrders.length > 0 && <span className="nav__count">{pendingOrders.length}</span>}
          </NavLink>
          <NavLink to="/listings" className={navClass}>
            <NavIcon src={iconListings} />
            Manage Listings
          </NavLink>
          <div className="nav__sub">
            <NavLink to="/listings/new" className={subNavClass}>
              List New Item
            </NavLink>
            <NavLink to="/listings" end className={subNavClass}>
              View All Listings
            </NavLink>
          </div>
          <NavLink to="/payments" className={navClass}>
            <NavIcon src={iconPayments} />
            My Payments
          </NavLink>
          <NavLink to="/analytics" className={navClass}>
            <NavIcon src={iconAnalytics} />
            Analytics
          </NavLink>
          <NavLink to="/photoshoots" className={navClass}>
            <NavIcon src={iconCamera} />
            Photoshoots
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            <NavIcon src={iconSettings} />
            Store Settings
          </NavLink>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <span />
            <span />
            <span />
          </button>
          <Link to="/" className="topbar__logo" aria-label="Losóde dashboard home">
            {/* Only shown on phones, where the sidebar (and its logo) is hidden behind the menu button. */}
            <img src={logoDark} width={158} height={53} alt="Losóde" />
          </Link>
          <div className="topbar__right">
            <ProfileMenu />
            <Link to="/orders" className="topbar__bell" aria-label={`Notifications: ${pendingOrders.length} orders need attention`}>
              <img src={iconNotificationBell} width={38} height={38} alt="" />
            </Link>
          </div>
        </header>

        <main className="main__inner">
          <Outlet />
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
