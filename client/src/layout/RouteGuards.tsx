import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RouteGuards.css';

function FullPageLoader() {
  return (
    <div className="boot" role="status">
      <span className="boot__brand">Lean Body Club</span>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Pages that need a signed-in user. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'signedOut') {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Sign-in and sign-up: skip them when already signed in. */
export function PublicOnly() {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'signedIn') return <Navigate to="/" replace />;
  return <Outlet />;
}
