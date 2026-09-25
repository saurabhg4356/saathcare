import React, { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../context/FamilyContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { familyService } from '../services/familyService.js';
import { formatDate } from '../utils/date.js';
import { Users, Mail, Plus, UserCheck, Clock, Copy, Check, Shield } from 'lucide-react';
import { InviteMemberModal } from '../components/modals/InviteMemberModal.jsx';

export function FamilyDetailPage() {
  const { activeGroup, refreshGroups } = useFamily();
  const { subscribe } = useSocket();

  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  const fetchInvites = useCallback(async () => {
    if (!activeGroup?._id) return;
    try {
      const invites = await familyService.getPendingInvites(activeGroup._id);
      setPendingInvites(invites || []);
    } catch (err) {
      console.error('Failed to load pending invites', err);
    } finally {
      setLoading(false);
    }
  }, [activeGroup?._id]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Real-time socket updates when a member joins
  useEffect(() => {
    if (!activeGroup?._id) return;

    const unsubs = [
      subscribe('member:joined', () => {
        refreshGroups();
        fetchInvites();
      })
    ];

    return () => {
      unsubs.forEach(unsub => unsub?.());
    };
  }, [activeGroup?._id, subscribe, refreshGroups, fetchInvites]);

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/accept-invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const members = activeGroup?.members || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
            Care Team & Family Roster
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Members coordinating daily care and expenses for {activeGroup?.careRecipientName}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <Mail size={16} />
          Invite Family Member
        </button>
      </div>

      {/* Permissions Note */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(20, 184, 166, 0.08)',
        border: '1px solid rgba(20, 184, 166, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem'
      }}>
        <Shield size={20} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: '#ccfbf1' }}>
          <strong>Equal Permission Model:</strong> All connected family members have equal permissions to create duties, mark tasks complete, log medical expenses, and view settlements.
        </div>
      </div>

      {/* Grid: Active Members */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={20} color="var(--accent-emerald)" />
          Active Caregivers ({members.length})
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {members.map(member => (
            <div key={member._id} className="card card-interactive" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--grad-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}>
                  {member.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{member.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                  Family Member
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Pending Invitations */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--accent-amber)" />
          Pending Invitations ({pendingInvites.length})
        </h2>

        {pendingInvites.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
            No pending invitations. All invited family members have joined the care team.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invitee Email</th>
                  <th>Invited By</th>
                  <th>Sent On</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map(invite => (
                  <tr key={invite._id}>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>{invite.email}</span>
                    </td>
                    <td>{invite.invitedBy?.name || 'Member'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDate(invite.createdAt)}
                    </td>
                    <td>
                      <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>
                        {invite.status} (Valid 7d)
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => handleCopyLink(invite.token)}
                        title="Copy invite URL"
                      >
                        {copiedToken === invite.token ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                        {copiedToken === invite.token ? 'Copied' : 'Copy Link'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSent={() => fetchInvites()}
      />
    </div>
  );
}
