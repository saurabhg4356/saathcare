import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFamily } from '../../context/FamilyContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Users, Plus, LogOut, ChevronDown, Activity, HeartHandshake } from 'lucide-react';
import { CreateGroupModal } from '../modals/CreateGroupModal.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const { familyGroups, activeGroup, selectGroup } = useFamily();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)'
      }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--grad-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}>
                <HeartHandshake size={24} color="#ffffff" />
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Saath<span style={{ color: 'var(--accent-cyan)' }}>Care</span>
                </span>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Elder-Care Coordination
                </span>
              </div>
            </Link>

            {/* Family Group Selector Dropdown */}
            {user && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-hover)' }}
                >
                  <Users size={16} color="var(--accent-teal)" />
                  <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeGroup ? activeGroup.careRecipientName : 'Select Family'}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {isGroupDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-hover)',
                      borderRadius: 'var(--radius-md)',
                      width: '240px',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 100,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
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
                )}
              </div>
            )}
          </div>

          {/* Right side actions: Socket status, user profile, logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Live Socket Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              <span className={isConnected ? 'live-pulse' : ''} style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'
              }}></span>
              <span style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {isConnected ? 'Live Sync' : 'Reconnecting'}
              </span>
            </div>

            {/* User Profile & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Logout"
                style={{ padding: '0.5rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </>
  );
}
