import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { SecurityBanners } from '../common/SecurityBanners.jsx';
import { useFamily } from '../../context/FamilyContext.jsx';
import { LayoutDashboard, CheckSquare, Receipt, Scale, Users, PlusCircle } from 'lucide-react';
import { CreateGroupModal } from '../modals/CreateGroupModal.jsx';

export function AppLayout() {
  const { activeGroup, familyGroups, loading } = useFamily();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks & Duties', shortLabel: 'Duties', icon: CheckSquare },
    { to: '/expenses', label: 'Expense Ledger', shortLabel: 'Ledger', icon: Receipt },
    { to: '/settlements', label: 'Settlements', shortLabel: 'Balances', icon: Scale },
    { to: '/family', label: 'Care Team', shortLabel: 'Family', icon: Users }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SecurityBanners />
      <Navbar />

      {/* Desktop Sub-navigation bar */}
      {activeGroup && (
        <div className="desktop-subnav" style={{
          background: 'rgba(15, 23, 42, 0.65)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
            <nav style={{ display: 'flex', gap: '0.25rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                      whiteSpace: 'nowrap'
                    })}
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Caring for:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                {activeGroup.careRecipientName}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main page content */}
      <main className="main-app-content" style={{ flex: 1, padding: '2rem 0' }}>
        <div className="app-container">
          {!loading && familyGroups.length === 0 ? (
            <div className="card flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <Users size={32} color="var(--accent-cyan)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome to SaathCare</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '1.5rem' }}>
                Start by creating your first care group for an elderly parent or family member. You can then invite siblings and coordinate duties and expenses together.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCreateOpen(true)}
              >
                <PlusCircle size={18} />
                Create Your Care Team
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {activeGroup && (
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.shortLabel}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
