import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert, Stethoscope, Phone, AlertCircle } from 'lucide-react';
import { familyService } from '../../services/familyService.js';

export function EditCareInfoModal({ isOpen, onClose, familyGroup, onUpdated }) {
  const [formData, setFormData] = useState({
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    doctorName: '',
    doctorPhone: '',
    doctorHospital: '',
    bloodGroup: '',
    allergies: '',
    importantNotes: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (familyGroup?.careInfo) {
      const ci = familyGroup.careInfo;
      setFormData({
        emergencyContactName: ci.emergencyContact?.name || '',
        emergencyContactPhone: ci.emergencyContact?.phone || '',
        emergencyContactRelationship: ci.emergencyContact?.relationship || '',
        doctorName: ci.primaryDoctor?.name || '',
        doctorPhone: ci.primaryDoctor?.phone || '',
        doctorHospital: ci.primaryDoctor?.hospital || '',
        bloodGroup: ci.bloodGroup || '',
        allergies: Array.isArray(ci.allergies) ? ci.allergies.join(', ') : '',
        importantNotes: ci.importantNotes || ''
      });
    }
  }, [familyGroup]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        emergencyContact: {
          name: formData.emergencyContactName.trim(),
          phone: formData.emergencyContactPhone.trim(),
          relationship: formData.emergencyContactRelationship.trim()
        },
        primaryDoctor: {
          name: formData.doctorName.trim(),
          phone: formData.doctorPhone.trim(),
          hospital: formData.doctorHospital.trim()
        },
        bloodGroup: formData.bloodGroup.trim(),
        allergies: formData.allergies
          ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        importantNotes: formData.importantNotes.trim()
      };

      const res = await familyService.updateCareInfo(familyGroup._id, payload);
      onUpdated?.(res.data?.careInfo);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update care information');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
          border: '1px solid var(--border-hover)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              Important Care Information
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {familyGroup?.careRecipientName}’s emergency and medical directory
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Emergency Contact */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose)', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              <ShieldAlert size={16} /> Emergency Contact
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="ec-name">Contact Name</label>
                <input
                  id="ec-name"
                  type="text"
                  name="emergencyContactName"
                  className="form-control"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ec-phone">Phone Number</label>
                <input
                  id="ec-phone"
                  type="tel"
                  name="emergencyContactPhone"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ec-rel">Relationship</label>
                <input
                  id="ec-rel"
                  type="text"
                  name="emergencyContactRelationship"
                  className="form-control"
                  placeholder="Son / Neighbor / Attendant"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Primary Doctor & Hospital */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              <Stethoscope size={16} /> Primary Physician & Hospital
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-name">Doctor Name</label>
                <input
                  id="doc-name"
                  type="text"
                  name="doctorName"
                  className="form-control"
                  placeholder="Dr. Verma (Cardiologist)"
                  value={formData.doctorName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-phone">Doctor Contact</label>
                <input
                  id="doc-phone"
                  type="tel"
                  name="doctorPhone"
                  className="form-control"
                  placeholder="+91 99887 76655"
                  value={formData.doctorPhone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-hosp">Hospital / Clinic</label>
                <input
                  id="doc-hosp"
                  type="text"
                  name="doctorHospital"
                  className="form-control"
                  placeholder="Apollo / Max Hospital"
                  value={formData.doctorHospital}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Vitals & Medical Nuances */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="bg">Blood Group</label>
                <input
                  id="bg"
                  type="text"
                  name="bloodGroup"
                  className="form-control"
                  placeholder="e.g. B+ or O-"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="allergies">Known Allergies</label>
                <input
                  id="allergies"
                  type="text"
                  name="allergies"
                  className="form-control"
                  placeholder="Penicillin, Sulfa, Peanuts (comma separated)"
                  value={formData.allergies}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label" htmlFor="notes">Important Health Notes & Directives</label>
              <textarea
                id="notes"
                name="importantNotes"
                className="form-control"
                rows={3}
                placeholder="Diabetic, prefers morning walks before 8am, pacemaker fitted in 2021..."
                value={formData.importantNotes}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Care Info'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
