import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  User,
  LogOut,
  Shield,
  FileText,
  PlusCircle,
  LayoutDashboard,
  DollarSign,
  Menu,
  X,
  Info,
  Home,
  Users,
  MessageSquare,
} from 'lucide-react';
import { connectionService } from '../services/connectionService';
import { messageService } from '../services/messageService';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingConnections, setPendingConnections] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingConnections(0);
      setUnreadMessages(0);
      return;
    }
    const fetchCounters = () => {
      connectionService
        .getPendingCount()
        .then((res) => setPendingConnections(res.count || 0))
        .catch(() => {});

      messageService
        .getUnreadCount()
        .then((res) => setUnreadMessages(res.unreadCount || 0))
        .catch(() => {});
    };
    fetchCounters();
    const interval = setInterval(fetchCounters, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Auto-close mobile drawer when user navigates
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;
  const isDonor = hasRole('ROLE_DONOR');
  const isAdmin = hasRole('ROLE_ADMIN');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <img
              src="/hop-logo.jpg"
              alt="HOP - Hope Of People"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e3a8a', letterSpacing: '-0.02em' }}>HOP</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Hope Of People</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="navbar-desktop-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
              About
            </Link>

            {/* Donor Links */}
            {isAuthenticated && isDonor && (
              <>
                <Link
                  to="/donor-dashboard"
                  className={`nav-link ${isActive('/donor-dashboard') ? 'active' : ''}`}
                  style={{ fontWeight: 600, color: 'var(--primary)' }}
                >
                  <LayoutDashboard size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Donor Dashboard
                </Link>
                <Link
                  to="/initiatives"
                  className={`nav-link ${isActive('/initiatives') ? 'active' : ''}`}
                >
                  <Heart size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Donate to Causes
                </Link>
                <Link
                  to="/my-donations"
                  className={`nav-link ${isActive('/my-donations') ? 'active' : ''}`}
                >
                  <DollarSign size={16} style={{ display: 'inline', marginRight: 4 }} />
                  My Donations
                </Link>
              </>
            )}

            {/* Beneficiary Links (Non-donors) */}
            {isAuthenticated && !isDonor && (
              <>
                <Link
                  to="/initiatives"
                  className={`nav-link ${isActive('/initiatives') ? 'active' : ''}`}
                >
                  Assistance Initiatives
                </Link>
                <Link
                  to="/my-requests"
                  className={`nav-link ${isActive('/my-requests') ? 'active' : ''}`}
                >
                  <FileText size={16} style={{ display: 'inline', marginRight: 4 }} />
                  My Requests
                </Link>
                <Link
                  to="/request-aid"
                  className={`nav-link ${isActive('/request-aid') ? 'active' : ''}`}
                >
                  <PlusCircle size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Apply for Aid
                </Link>
              </>
            )}

            {/* Authenticated Network Link */}
            {isAuthenticated && (
              <Link
                to="/network"
                className={`nav-link ${isActive('/network') ? 'active' : ''}`}
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Users size={16} />
                <span>Network</span>
                {pendingConnections > 0 && (
                  <span
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {pendingConnections}
                  </span>
                )}
              </Link>
            )}

            {/* Authenticated Messages Link */}
            {isAuthenticated && (
              <Link
                to="/messages"
                className={`nav-link ${isActive('/messages') ? 'active' : ''}`}
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <MessageSquare size={16} />
                <span>Messages</span>
                {unreadMessages > 0 && (
                  <span
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {unreadMessages}
                  </span>
                )}
              </Link>
            )}

            {/* Unauthenticated public links */}
            {!isAuthenticated && (
              <Link
                to="/initiatives"
                className={`nav-link ${isActive('/initiatives') ? 'active' : ''}`}
              >
                Assistance Initiatives
              </Link>
            )}

            {/* Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              >
                <Shield size={16} style={{ display: 'inline', marginRight: 4 }} />
                Admin Portal
              </Link>
            )}
          </div>

          {/* Desktop Auth Controls */}
          <div className="navbar-desktop-auth">
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/profile" className="btn btn-outline btn-sm">
                  <User size={15} />
                  <span>{user?.fullName || 'Profile'}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/login" className="btn btn-outline btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className={`navbar-mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer - Outside <nav> so backdrop-filter does NOT trap fixed positioning */}
      <div
        className={`navbar-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="navbar-drawer-links">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link
            to="/about"
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Info size={18} />
            <span>About HOP</span>
          </Link>

          {/* Donor Links */}
          {isAuthenticated && isDonor && (
            <>
              <Link
                to="/donor-dashboard"
                className={`nav-link ${isActive('/donor-dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontWeight: 600, color: 'var(--primary)' }}
              >
                <LayoutDashboard size={18} />
                <span>Donor Dashboard</span>
              </Link>
              <Link
                to="/initiatives"
                className={`nav-link ${isActive('/initiatives') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart size={18} />
                <span>Donate to Causes</span>
              </Link>
              <Link
                to="/my-donations"
                className={`nav-link ${isActive('/my-donations') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <DollarSign size={18} />
                <span>My Donations</span>
              </Link>
            </>
          )}

          {/* Beneficiary Links */}
          {isAuthenticated && !isDonor && (
            <>
              <Link
                to="/initiatives"
                className={`nav-link ${isActive('/initiatives') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart size={18} />
                <span>Assistance Initiatives</span>
              </Link>
              <Link
                to="/my-requests"
                className={`nav-link ${isActive('/my-requests') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FileText size={18} />
                <span>My Requests</span>
              </Link>
              <Link
                to="/request-aid"
                className={`nav-link ${isActive('/request-aid') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <PlusCircle size={18} />
                <span>Apply for Aid</span>
              </Link>
            </>
          )}

          {/* Authenticated Network Link (Mobile) */}
          {isAuthenticated && (
            <Link
              to="/network"
              className={`nav-link ${isActive('/network') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Users size={18} />
              <span>Community Network</span>
              {pendingConnections > 0 && (
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginLeft: 'auto',
                  }}
                >
                  {pendingConnections}
                </span>
              )}
            </Link>
          )}

          {/* Authenticated Messages Link (Mobile) */}
          {isAuthenticated && (
            <Link
              to="/messages"
              className={`nav-link ${isActive('/messages') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <MessageSquare size={18} />
              <span>Messenger</span>
              {unreadMessages > 0 && (
                <span
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginLeft: 'auto',
                  }}
                >
                  {unreadMessages} new
                </span>
              )}
            </Link>
          )}

          {/* Unauthenticated public links */}
          {!isAuthenticated && (
            <Link
              to="/initiatives"
              className={`nav-link ${isActive('/initiatives') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart size={18} />
              <span>Assistance Initiatives</span>
            </Link>
          )}

          {/* Admin Link */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Shield size={18} />
              <span>Admin Portal</span>
            </Link>
          )}
        </div>

        {/* Mobile Auth Controls */}
        <div className="navbar-drawer-auth">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={18} />
                <span>My Profile ({user?.fullName})</span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Link
                to="/login"
                className="btn btn-outline"
                style={{ justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dim Backdrop */}
      <div
        className={`navbar-mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />
    </>
  );
};
