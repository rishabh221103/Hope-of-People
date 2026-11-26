import React, { useState, useEffect, useRef } from 'react';
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
  Briefcase,
  Bell,
  Film,
  ChevronDown,
  MessagesSquare,
  Radio,
  Search,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { connectionService } from '../services/connectionService';
import { messageService } from '../services/messageService';
import { notificationService } from '../services/notificationService';
import { searchService, SearchResultItem } from '../services/searchService';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [pendingConnections, setPendingConnections] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const featuresDropdownRef = useRef<HTMLDivElement>(null);

  // Global search state
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [navSearchResults, setNavSearchResults] = useState<SearchResultItem[]>([]);
  const [navSearchLoading, setNavSearchLoading] = useState(false);
  const [navSearchOpen, setNavSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced quick search
  useEffect(() => {
    if (!navSearchQuery.trim() || navSearchQuery.trim().length < 2) {
      setNavSearchResults([]);
      setNavSearchLoading(false);
      return;
    }

    setNavSearchLoading(true);
    const handler = setTimeout(() => {
      searchService
        .quickSearch(navSearchQuery.trim())
        .then((res) => {
          setNavSearchResults(res.allResults || []);
          setNavSearchLoading(false);
        })
        .catch(() => {
          setNavSearchLoading(false);
        });
    }, 250);

    return () => clearTimeout(handler);
  }, [navSearchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setNavSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navSearchQuery.trim()) return;
    setNavSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(navSearchQuery.trim())}`);
  };

  const handleSelectSearchResult = (url: string) => {
    setNavSearchOpen(false);
    setNavSearchQuery('');
    navigate(url);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingConnections(0);
      setUnreadMessages(0);
      setUnreadNotifications(0);
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

      notificationService
        .getUnreadCount()
        .then((res) => setUnreadNotifications(res.count || 0))
        .catch(() => {});
    };
    fetchCounters();
    const interval = setInterval(fetchCounters, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close features dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (featuresDropdownRef.current && !featuresDropdownRef.current.contains(event.target as Node)) {
        setFeaturesDropdownOpen(false);
      }
    };
    if (featuresDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [featuresDropdownOpen]);

  // Auto-close mobile drawer and dropdown when user navigates
  useEffect(() => {
    setMobileMenuOpen(false);
    setFeaturesDropdownOpen(false);
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

  const isFeaturesActive = ['/podcasts', '/community', '/reels', '/business-hub', '/network', '/messages'].some(path => location.pathname.startsWith(path));
  const totalFeatureBadges = pendingConnections + unreadMessages;

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

            {/* Consolidated 5-in-1 Community & Hub Features Dropdown */}
            <div ref={featuresDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
              <button
                type="button"
                onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
                className={`nav-link ${isFeaturesActive ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: isFeaturesActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  color: isFeaturesActive ? 'var(--primary)' : 'inherit',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '0.5rem',
                  transition: 'all 0.15s ease',
                }}
                title="Community & Features: Forum, Reels, Podcasts, Business Hub, Network, Messages"
              >
                <span>Community Hub</span>
                {totalFeatureBadges > 0 && (
                  <span
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {totalFeatureBadges}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  style={{
                    transform: featuresDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {featuresDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: '0',
                    width: '290px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.85rem',
                    boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.14), 0 6px 12px -4px rgba(0, 0, 0, 0.08)',
                    padding: '0.5rem',
                    zIndex: 1050,
                  }}
                >
                  <div style={{ padding: '0.35rem 0.65rem 0.45rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                      Community & Hub Features
                    </span>
                  </div>

                  {/* 1. Community Forum */}
                  <Link
                    to="/community"
                    onClick={() => setFeaturesDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: isActive('/community') ? '#0284c7' : '#1e293b',
                      backgroundColor: isActive('/community') ? '#f0f9ff' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ padding: '0.4rem', backgroundColor: '#e0f2fe', borderRadius: '0.5rem', color: '#0284c7', display: 'flex' }}>
                      <MessagesSquare size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Community Forum</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Discussions, advice & gear sharing</div>
                    </div>
                  </Link>

                  {/* 2. HOP Reels */}
                  <Link
                    to="/reels"
                    onClick={() => setFeaturesDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: isActive('/reels') ? '#f43f5e' : '#1e293b',
                      backgroundColor: isActive('/reels') ? '#fff1f2' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ padding: '0.4rem', backgroundColor: '#ffe4e6', borderRadius: '0.5rem', color: '#f43f5e', display: 'flex' }}>
                      <Film size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>HOP Reels</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Short vertical impact videos</div>
                    </div>
                  </Link>

                  {/* 3. HOP Podcasts */}
                  <Link
                    to="/podcasts"
                    onClick={() => setFeaturesDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: isActive('/podcasts') ? '#4338ca' : '#1e293b',
                      backgroundColor: isActive('/podcasts') ? '#e0e7ff' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ padding: '0.4rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem', color: '#4338ca', display: 'flex' }}>
                      <Radio size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>HOP Podcasts</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Audio recovery stories & advice</div>
                    </div>
                  </Link>

                  {/* 2. Business Hub */}
                  <Link
                    to="/business-hub"
                    onClick={() => setFeaturesDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: isActive('/business-hub') ? '#2563eb' : '#1e293b',
                      backgroundColor: isActive('/business-hub') ? '#eff6ff' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ padding: '0.4rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem', color: '#2563eb', display: 'flex' }}>
                      <Briefcase size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Business Hub</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Micro-grants & self-reliance</div>
                    </div>
                  </Link>

                  {/* 3. Community Network */}
                  <Link
                    to="/network"
                    onClick={() => setFeaturesDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: isActive('/network') ? '#0d9488' : '#1e293b',
                      backgroundColor: isActive('/network') ? '#f0fdfa' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ padding: '0.4rem', backgroundColor: '#ccfbf1', borderRadius: '0.5rem', color: '#0d9488', display: 'flex' }}>
                      <Users size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Community Network</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Connections & mutual aid</div>
                      </div>
                      {pendingConnections > 0 && (
                        <span style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: '9999px', padding: '0.1rem 0.45rem', fontSize: '0.65rem', fontWeight: 700 }}>
                          {pendingConnections}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* 4. Messages */}
                  <Link
                    to="/messages"
                    onClick={() => setFeaturesDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: isActive('/messages') ? '#7c3aed' : '#1e293b',
                      backgroundColor: isActive('/messages') ? '#f5f3ff' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ padding: '0.4rem', backgroundColor: '#ede9fe', borderRadius: '0.5rem', color: '#7c3aed', display: 'flex' }}>
                      <MessageSquare size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Messenger</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Direct private chat</div>
                      </div>
                      {unreadMessages > 0 && (
                        <span style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: '9999px', padding: '0.1rem 0.45rem', fontSize: '0.65rem', fontWeight: 700 }}>
                          {unreadMessages}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              )}
            </div>

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

          {/* Desktop Global Search Bar */}
          <div ref={searchContainerRef} style={{ position: 'relative', margin: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
            <form onSubmit={handleNavSearchSubmit} style={{ position: 'relative', width: '220px', transition: 'width 0.2s ease' }}>
              <input
                type="text"
                placeholder="Search HOP..."
                value={navSearchQuery}
                onFocus={() => setNavSearchOpen(true)}
                onChange={(e) => {
                  setNavSearchQuery(e.target.value);
                  setNavSearchOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '0.4rem 2rem 0.4rem 2.1rem',
                  fontSize: '0.82rem',
                  borderRadius: '9999px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  e.currentTarget.parentElement!.style.width = '280px';
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                  if (!navSearchQuery) {
                    e.currentTarget.parentElement!.style.width = '220px';
                  }
                }}
              />
              <Search
                size={14}
                color="#94a3b8"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              {navSearchLoading ? (
                <Loader2
                  size={14}
                  color="#2563eb"
                  className="animate-spin"
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              ) : navSearchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setNavSearchQuery('');
                    setNavSearchResults([]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <X size={13} />
                </button>
              ) : null}
            </form>

            {/* Quick Autocomplete Dropdown */}
            {navSearchOpen && navSearchQuery.trim().length >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  left: 0,
                  width: '320px',
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.15)',
                  padding: '0.5rem',
                  zIndex: 1100,
                  maxHeight: '380px',
                  overflowY: 'auto',
                }}
              >
                {navSearchResults.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                    {navSearchLoading ? 'Searching...' : `No quick matches for "${navSearchQuery}"`}
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Top Matches
                    </div>
                    {navSearchResults.slice(0, 6).map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => handleSelectSearchResult(item.url)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            backgroundColor:
                              item.type === 'CAUSE'
                                ? '#ecfdf5'
                                : item.type === 'REEL'
                                ? '#fff1f2'
                                : item.type === 'PODCAST'
                                ? '#eef2ff'
                                : item.type === 'FORUM_POST'
                                ? '#f0f9ff'
                                : '#eff6ff',
                            color:
                              item.type === 'CAUSE'
                                ? '#059669'
                                : item.type === 'REEL'
                                ? '#e11d48'
                                : item.type === 'PODCAST'
                                ? '#4f46e5'
                                : item.type === 'FORUM_POST'
                                ? '#0284c7'
                                : '#2563eb',
                            flexShrink: 0,
                          }}
                        >
                          {item.type === 'CAUSE'
                            ? 'CAUSE'
                            : item.type === 'REEL'
                            ? 'REEL'
                            : item.type === 'PODCAST'
                            ? 'AUDIO'
                            : item.type === 'FORUM_POST'
                            ? 'FORUM'
                            : 'BIZ'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </div>
                          {item.category && (
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.category}</div>
                          )}
                        </div>
                      </button>
                    ))}
                    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={handleNavSearchSubmit}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>See all results for &ldquo;{navSearchQuery}&rdquo;</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Desktop Auth Controls */}
          <div className="navbar-desktop-auth">
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NotificationDropdown />
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
          {/* Mobile Global Search Input */}
          <form
            onSubmit={(e) => {
              handleNavSearchSubmit(e);
              setMobileMenuOpen(false);
            }}
            style={{ padding: '0.5rem 0.75rem 0.75rem' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              borderRadius: '9999px',
              padding: '0.45rem 0.85rem',
              gap: '0.5rem',
              border: '1px solid #e2e8f0',
            }}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Search causes, reels, podcasts..."
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  width: '100%',
                }}
              />
              {navSearchQuery && (
                <button
                  type="button"
                  onClick={() => setNavSearchQuery('')}
                  style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </form>

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

          {/* Community & Hub Features (Mobile) */}
          <div style={{ padding: '0.65rem 0.5rem 0.2rem', marginTop: '0.25rem', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
              Community & Hub
            </span>
          </div>

          <Link
            to="/community"
            className={`nav-link ${isActive('/community') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <MessagesSquare size={18} style={{ color: '#0284c7' }} />
            <span>Community Forum</span>
          </Link>

          <Link
            to="/reels"
            className={`nav-link ${isActive('/reels') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Film size={18} style={{ color: '#f43f5e' }} />
            <span>HOP Reels</span>
          </Link>

          <Link
            to="/podcasts"
            className={`nav-link ${isActive('/podcasts') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Radio size={18} style={{ color: '#4338ca' }} />
            <span>HOP Podcasts</span>
          </Link>

          <Link
            to="/business-hub"
            className={`nav-link ${isActive('/business-hub') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Briefcase size={18} style={{ color: '#2563eb' }} />
            <span>Business Hub</span>
          </Link>

          {/* Authenticated Network Link (Mobile) */}
          {isAuthenticated && (
            <Link
              to="/network"
              className={`nav-link ${isActive('/network') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Users size={18} style={{ color: '#0d9488' }} />
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
              <MessageSquare size={18} style={{ color: '#7c3aed' }} />
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

          {/* Authenticated Notifications Link in Drawer */}
          {isAuthenticated && (
            <Link
              to="/notifications"
              className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Bell size={18} style={{ color: '#ea580c' }} />
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <span
                  style={{
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginLeft: 'auto',
                  }}
                >
                  {unreadNotifications} new
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
