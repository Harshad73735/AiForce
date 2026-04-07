import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { ToastHost } from './Toast';
import { CalendarDays, CircleUserRound, Images, LayoutDashboard, LibraryBig, LogOut, Palette, Sparkles } from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: CircleUserRound },
  { to: '/products', label: 'Products', icon: LibraryBig },
  { to: '/drafts', label: 'Drafts', icon: Sparkles },
  { to: '/media-library', label: 'Media', icon: Images },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/ai-studio', label: 'AI Studio', icon: Palette },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, logout, profile } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            {profile.logoUrl ? <img src={profile.logoUrl} alt="Brand logo" className="brand-logo" /> : 'SS'}
          </div>
          <div>
            <div className="brand-title">{profile.businessName}</div>
            <div className="brand-subtitle">Premium social workspace</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <link.icon size={16} strokeWidth={2.1} />
              <span>{link.label}</span>
            </NavLink>
          ))}
          <button className="nav-link nav-button" onClick={handleLogout}>
            <LogOut size={16} strokeWidth={2.1} />
            Logout
          </button>
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">Business workspace</div>
            <h1>{links.find((entry) => entry.to === location.pathname)?.label ?? 'Dashboard'}</h1>
          </div>
          <div className="topbar-meta">
            <div className="user-chip">
              <span>{session?.user.name}</span>
              <small>{session?.user.email}</small>
            </div>
            <button className="btn btn-secondary mobile-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <nav className="mobile-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
              <link.icon size={14} strokeWidth={2.2} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <main className="page-enter">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}