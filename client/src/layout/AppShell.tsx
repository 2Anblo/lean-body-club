import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { cx } from '../lib/cx';
import './AppShell.css';

const NAV: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/groups', label: 'Groups', icon: 'users' },
  { to: '/progress', label: 'Progress', icon: 'chart' },
];

/** Signed-in layout: sidebar on desktop, bottom tab bar on phones. */
export function AppShell() {
  const { pathname } = useLocation();

  // Start each new screen at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <main id="main" className="shell__main" tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function Sidebar() {
  const { user, signOut } = useAuth();
  const { openCheckIn } = useUI();
  const navigate = useNavigate();

  async function logOut() {
    await signOut();
    navigate('/signin', { replace: true });
  }

  return (
    <aside className="sidebar hide-mobile">
      <Link to="/" className="sidebar__brand">
        Lean Body Club
      </Link>
      <Button block icon="plus" onClick={() => openCheckIn()}>
        Check in
      </Button>
      <nav className="sidebar__nav" aria-label="Main">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => cx('side-link', isActive && 'side-link--active')}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__bottom">
        {user && (
          <NavLink to="/account" className={({ isActive }) => cx('side-profile', isActive && 'side-profile--active')}>
            <Avatar name={user.name} size={36} tone="soft" />
            <span className="side-profile__text">
              <span className="side-profile__name">{user.name}</span>
              <span className="meta">{user.email.split('@')[0]}</span>
            </span>
          </NavLink>
        )}
        <button type="button" className="side-link" onClick={logOut}>
          <Icon name="logout" size={20} />
          Log out
        </button>
      </div>
    </aside>
  );
}

function BottomNav() {
  const { openCheckIn } = useUI();
  const item = ({ isActive }: { isActive: boolean }) => cx('tab', isActive && 'tab--active');
  return (
    <nav className="bottom-nav hide-desktop" aria-label="Main">
      <NavLink to="/" end className={item}>
        <Icon name="home" size={22} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/groups" className={item}>
        <Icon name="users" size={22} />
        <span>Groups</span>
      </NavLink>
      <button type="button" className="tab tab--checkin" onClick={() => openCheckIn()}>
        <span className="tab__plus">
          <Icon name="plus" size={20} />
        </span>
        <span>Check in</span>
      </button>
      <NavLink to="/progress" className={item}>
        <Icon name="chart" size={22} />
        <span>Progress</span>
      </NavLink>
    </nav>
  );
}
