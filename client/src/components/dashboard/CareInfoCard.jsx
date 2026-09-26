import React, { useState } from 'react';
import {
  ShieldAlert,
  Phone,
  Stethoscope,
  Heart,
  AlertCircle,
  Edit2,
  FileText
} from 'lucide-react';
import { EditCareInfoModal } from '../modals/EditCareInfoModal.jsx';

export function CareInfoCard({ familyGroup, onCareInfoUpdated }) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const careInfo = familyGroup?.careInfo || {};
  const hasEmergency = Boolean(careInfo.emergencyContact?.name || careInfo.emergencyContact?.phone);
  const hasDoctor = Boolean(careInfo.primaryDoctor?.name || careInfo.primaryDoctor?.phone);
  const hasNotes = Boolean(careInfo.importantNotes || careInfo.allergies?.length || careInfo.bloodGroup);

  return (
    <>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.85rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Heart size={18} color="var(--accent-rose)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>
                Important Information & Emergency Directory
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Critical medical facts for {familyGroup?.careRecipientName}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {careInfo.bloodGroup && (
              <span className="badge badge-missed" style={{ fontSize: '0.75rem', fontWeight: '800' }}>
                Blood Group: {careInfo.bloodGroup}
              </span>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditOpen(true)}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              <Edit2 size={13} />
              Edit Info
            </button>
          </div>
        </div>

        {/* 3-Column Responsive Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Emergency Contact */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <ShieldAlert size={14} /> Emergency Contact
            </div>
            {hasEmergency ? (
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.925rem' }}>
                  {careInfo.emergencyContact.name || 'Not specified'}
                </div>
                {careInfo.emergencyContact.relationship && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Relation: {careInfo.emergencyContact.relationship}
                  </div>
                )}
                {careInfo.emergencyContact.phone && (
                  <a
                    href={`tel:${careInfo.emergencyContact.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      marginTop: '0.4rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Phone size={13} /> {careInfo.emergencyContact.phone}
                  </a>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No emergency contact configured yet. Click Edit Info to add.
              </span>
            )}
          </div>

          {/* Primary Physician */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <Stethoscope size={14} /> Primary Doctor / Clinic
            </div>
            {hasDoctor ? (
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.925rem' }}>
                  {careInfo.primaryDoctor.name || 'Doctor not specified'}
                </div>
                {careInfo.primaryDoctor.hospital && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {careInfo.primaryDoctor.hospital}
                  </div>
                )}
                {careInfo.primaryDoctor.phone && (
                  <a
                    href={`tel:${careInfo.primaryDoctor.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      marginTop: '0.4rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Phone size={13} /> {careInfo.primaryDoctor.phone}
                  </a>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No physician or clinic added yet.
              </span>
            )}
          </div>

          {/* Medical Directives & Allergies */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <FileText size={14} /> Directives & Allergies
            </div>
            {hasNotes ? (
              <div>
                {careInfo.allergies && careInfo.allergies.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    {careInfo.allergies.map((allergy, i) => (
                      <span key={i} className="badge badge-missed" style={{ fontSize: '0.65rem' }}>
                        Allergy: {allergy}
                      </span>
                    ))}
                  </div>
                )}
                {careInfo.importantNotes && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0 }}>
                    {careInfo.importantNotes}
                  </p>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No allergies or directives recorded.
              </span>
            )}
          </div>
        </div>
      </div>

      <EditCareInfoModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        familyGroup={familyGroup}
        onUpdated={onCareInfoUpdated}
      />
    </>
  );
}
