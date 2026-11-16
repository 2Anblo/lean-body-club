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

/**
 * Sign-in and sign-up: skip them when already signed in. Right after signing in
 * this is what moves you on, so it goes back to the page that asked you to sign in.
 */
export function PublicOnly() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'signedIn') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from.startsWith('/') ? from : '/'} replace />;
  }
  return <Outlet />;
}
