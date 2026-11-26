import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './Spinner';

/** Only logged-in users get through; others go to /login (and come back afterwards). */
export function ProtectedRoute() {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking && !user) return <PageLoader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Only admins get through; normal users are sent to their tickets. */
export function AdminRoute() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/tickets" replace />;
  return <Outlet />;
}

/**
 * Login/Register pages. As soon as there is a user (already logged in, or the
 * form just succeeded) we leave: back to the page that sent you to /login,
 * otherwise admins land on the dashboard and users on their tickets.
 */
export function GuestRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const from = location.state?.from;
    const fallback = user.role === 'admin' ? '/admin' : '/tickets';
    const target = from ? `${from.pathname}${from.search || ''}` : fallback;
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}
