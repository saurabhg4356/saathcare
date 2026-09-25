import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, CheckCircle2, Receipt, Scale, Zap, Shield, ArrowRight, Clock, Users } from 'lucide-react';

export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10, 15, 29, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '74px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
              <HeartHandshake size={24} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Saath<span style={{ color: 'var(--accent-cyan)' }}>Care</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '5rem 0 4rem 0', textAlign: 'center', position: 'relative' }}>
        <div className="app-container" style={{ maxWidth: '860px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '1.5rem' }}>
            <span className="live-pulse"></span>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)', letterSpacing: '0.04em' }}>
              DESIGNED FOR DISTRIBUTED FAMILIES
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.5rem' }}>
            Shared Elder-Care Coordination <br />
            <span style={{ background: 'var(--grad-brand-glow)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              & Transparent Cost Ledger
            </span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '720px', marginInline: 'auto' }}>
            Caring for an aging parent when siblings live across different cities or countries. Coordinate daily health duties, track medical expenses with an append-only ledger, and settle balances with zero friction.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              Create Your Family Care Team <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
              Sign In to Your Team
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div style={{ marginTop: '3.5rem', display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={16} color="var(--accent-teal)" /> Strict Family Data Isolation
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Receipt size={16} color="var(--accent-cyan)" /> Append-Only Immutable Ledger
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={16} color="var(--accent-amber)" /> Real-Time Live Sync
            </div>
          </div>
        </div>
      </section>

      {/* Two Pillars Section */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Two Critical Problems, One Unified Platform</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Core principle: <strong style={{ color: 'var(--text-primary)' }}>Shared accountability + transparent financial history.</strong>
            </p>
          </div>

          <div className="grid-cols-auto">
            {/* Pillar 1 */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <CheckCircle2 size={26} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>1. Shared Elder-Care Responsibilities</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.7', marginBottom: '1.25rem' }}>
                No more wondering whether morning medications were administered or doctor appointments booked. Tasks are explicitly assigned to a responsible family member with live status tracking.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--accent-teal)" /> Automated missed-task detection via background scheduler
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} color="var(--accent-teal)" /> Round-robin duty rotations for fair responsibility distribution
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={16} color="var(--accent-teal)" /> Instant WebSocket alerts when a sibling marks a task done
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Scale size={26} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>2. Shared Medical & Care Expenses</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.7', marginBottom: '1.25rem' }}>
                Medical emergencies and recurring attendant salaries create financial friction without clear records. SaathCare records every rupee in an immutable append-only ledger.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Receipt size={16} color="var(--accent-emerald)" /> Zero record editing or deletion — corrections via reversing entries
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={16} color="var(--accent-emerald)" /> Integer paise precision eliminates floating-point financial drift
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Scale size={16} color="var(--accent-emerald)" /> Greedy debt-minimization algorithm calculates minimal transfers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '2.5rem 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="app-container">
          <p>© 2026 SaathCare Platform. Engineered for production-grade reliability, transparent accounting, and compassionate elder care.</p>
        </div>
      </footer>
    </div>
  );
}
