import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFamily } from '../../context/FamilyContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Users, Plus, LogOut, ChevronDown, HeartHandshake } from 'lucide-react';
import { CreateGroupModal } from '../modals/CreateGroupModal.jsx';
import { ThemeToggle } from '../common/ThemeToggle.jsx';
import { NotificationDrawer } from '../common/NotificationDrawer.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const { familyGroups, activeGroup, selectGroup } = useFamily();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  // Close dropdown on click/touch outside
  useEffect(() => {
    function handleClickOutside(event) {
      const inDesktop = desktopDropdownRef.current && desktopDropdownRef.current.contains(event.target);
      const inMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(event.target);
      if (!inDesktop && !inMobile) {
        setIsGroupDropdownOpen(false);
      }
    }
    if (isGroupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isGroupDropdownOpen]);

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const renderDropdownMenu = (isMobile = false) => (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: isMobile ? 0 : 'auto',
        marginTop: '0.4rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-hover)',
        borderRadius: 'var(--radius-md)',
        width: isMobile ? '100%' : '260px',
        maxWidth: isMobile ? '100%' : 'calc(100vw - 2rem)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 150,
        overflow: 'hidden'
      }}
    >
      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', fontWeight: '600' }}>
        Your Care Teams
      </div>
      {familyGroups.map(group => (
        <div
          key={group._id}
          onClick={() => {
            selectGroup(group._id);
            setIsGroupDropdownOpen(false);
          }}
          style={{
            padding: '0.65rem 0.75rem',
            cursor: 'pointer',
            background: activeGroup?._id === group._id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
            color: activeGroup?._id === group._id ? 'var(--accent-cyan)' : 'var(--text-primary)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <span style={{ fontWeight: activeGroup?._id === group._id ? '600' : 'normal' }}>
            {group.careRecipientName}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {group.members?.length || 1} {group.members?.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          setIsGroupDropdownOpen(false);
          setIsCreateGroupOpen(true);
        }}
        style={{
          width: '100%',
          padding: '0.65rem 0.75rem',
          background: 'transparent',
          color: 'var(--accent-cyan)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textAlign: 'left'
        }}
      >
        <Plus size={16} />
        Add New Care Team
      </button>
    </div>
  );

  return (
    <>
      <header className="app-header">
        <div className="app-container">
          {/* Main Top Bar */}
          <div className="navbar-container">
            {/* Logo & Brand + Desktop Family Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0, flexWrap: 'nowrap' }}>
              <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--grad-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  <HeartHandshake size={20} color="#ffffff" />
                </div>
                <div>
                  <span className="navbar-brand-text" style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    Saath<span style={{ color: 'var(--accent-cyan)' }}>Care</span>
                  </span>
                  <span className="navbar-brand-sub">
                    Elder-Care Coordination
                  </span>
                </div>
              </Link>

              {/* Desktop Family Group Selector Dropdown */}
              {user && (
                <div className="desktop-family-select" style={{ position: 'relative' }} ref={desktopDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                    className="btn btn-secondary btn-sm family-select-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-hover)', padding: '0.4rem 0.75rem' }}
                  >
                    <Users size={15} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
                    <span className="family-select-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {activeGroup ? activeGroup.careRecipientName : 'Select Family'}
                    </span>
                    <ChevronDown size={13} style={{ flexShrink: 0 }} />
                  </button>

                  {isGroupDropdownOpen && renderDropdownMenu(false)}
                </div>
              )}
            </div>

            {/* Right side actions */}
            <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0, flexWrap: 'nowrap' }}>
              {/* Live Socket Status */}
              <div
                title={isConnected ? 'Real-Time Live Sync Active' : 'Connecting to Real-Time Gateway...'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                  border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}
              >
                <span className={isConnected ? 'live-pulse' : ''} style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  display: 'inline-block'
                }}></span>
                <span className="navbar-live-text" style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {isConnected ? 'Live Sync' : 'Offline'}
                </span>
              </div>

              {/* In-App Notifications */}
              {user && <NotificationDrawer />}

              {/* Light / Dark Mode Toggle */}
              <ThemeToggle />

              {/* User Profile & Logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <div className="navbar-user-info" style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Logout"
                  style={{ padding: '0.45rem', minWidth: '34px', minHeight: '34px' }}
                  aria-label="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Dedicated Care Team Selector Strip (Row 2 on mobile) */}
          {user && familyGroups.length > 0 && (
            <div className="mobile-family-select-strip" ref={mobileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                className="mobile-family-strip-btn"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <Users size={14} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Care Team:</span>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeGroup ? activeGroup.careRecipientName : 'Select Family Team'}
                  </strong>
                </div>
                <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </button>

              {isGroupDropdownOpen && renderDropdownMenu(true)}
            </div>
          )}
        </div>
      </header>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </>
  );
}
