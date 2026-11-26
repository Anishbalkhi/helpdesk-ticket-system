import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LifeBuoy, ListChecks, LogOut, Menu, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { RoleBadge } from './Badge';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // close the mobile menu whenever the page changes
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const links = [
    { to: '/tickets', label: 'Tickets', icon: ListChecks, end: true },
    { to: '/tickets/new', label: 'New ticket', icon: Plus },
    ...(isAdmin ? [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }] : []),
  ];

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/tickets" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          </span>
          HelpDesk
        </Link>

        {/* desktop links */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />

          <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 md:flex">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
            <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm" title="Log out">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Main">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{user.name}</span>
              <RoleBadge role={user.role} />
            </div>
            <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
