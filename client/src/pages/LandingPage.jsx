import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  CheckCircle2,
  Receipt,
  Scale,
  Zap,
  Shield,
  ArrowRight,
  Clock,
  Users,
  Calendar,
  Lock,
  Activity,
  CheckSquare,
  Sparkles,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle.jsx';
import { ContactForm } from '../components/common/ContactForm.jsx';
import { statsService } from '../services/statsService.js';

export function LandingPage() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    statsService.getPublicStats()
      .then((data) => {
        if (isMounted && data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load public stats:', err.message);
      })
      .finally(() => {
        if (isMounted) setStatsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '74px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            <span style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Saath<span style={{ color: 'var(--accent-cyan)' }}>Care</span>
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a href="#what-we-do" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', textDecoration: 'none' }}>
              What We Do
            </a>
            <a href="#how-it-works" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', textDecoration: 'none' }}>
              How It Works
            </a>
            <a href="#contact-us" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', textDecoration: 'none' }}>
              Contact
            </a>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }}></div>

            <ThemeToggle />

            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '5rem 0 3.5rem 0', textAlign: 'center', position: 'relative' }}>
        <div className="app-container" style={{ maxWidth: '880px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            marginBottom: '1.5rem'
          }}>
            <span className="live-pulse"></span>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)', letterSpacing: '0.04em' }}>
              BUILT FOR DISTRIBUTED SIBLINGS & CAREGIVERS
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Shared Elder-Care Coordination <br />
            <span style={{ background: 'var(--grad-brand-glow)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              & Transparent Cost Ledger
            </span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '740px', marginInline: 'auto' }}>
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

          {/* Real-data Usage Statistics Bar */}
          <div style={{
            marginTop: '3.5rem',
            padding: '1.5rem 2rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                {statsLoading ? '...' : (stats?.activeFamilies ?? 1)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                Families Coordinated
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                {statsLoading ? '...' : (stats?.totalCaregivers ?? 2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                Active Caregivers
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--accent-teal)' }}>
                {statsLoading ? '...' : (stats?.completedDuties ?? 0)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                Care Tasks Completed
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--accent-amber)' }}>
                {statsLoading ? '...' : `₹${Math.round((stats?.totalExpensesPaise || 0) / 100).toLocaleString('en-IN')}`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                Medical Costs Managed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="what-we-do" style={{ padding: '5rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              <Sparkles size={16} /> What We Do
            </div>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Holistic Support for Modern Elder Care
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              SaathCare brings together daily health logistics and financial clarity so siblings can focus on what truly matters: providing compassionate care for aging parents.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {/* Card 1 */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <CheckSquare size={24} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Coordinate Care Duties</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Schedule daily medication reminders, doctor visits, and therapy sessions with explicit sibling assignment and automated missed-task detection.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Receipt size={24} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Append-Only Cost Ledger</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Log every medical bill and attendant expense with integer-paise accuracy. No accidental edits or deletions; full financial transparency for everyone.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Zap size={24} color="var(--accent-teal)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Real-Time Live Sync</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Live WebSocket updates keep siblings informed in real time across time zones. Never again send a text asking "did anyone give Dad his medicine?"
              </p>
            </div>

            {/* Card 4 */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Scale size={24} color="var(--accent-amber)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Settle Up Without Friction</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Intelligent debt-minimization algorithms automatically compute the fewest money transfers required to balance medical outlays fairly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: '5rem 0' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-teal)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              <HelpCircle size={16} /> How It Works
            </div>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Get Started in Four Simple Steps
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Streamlined setup designed to accommodate tech-savvy siblings and non-technical family members alike.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', position: 'relative' }}>
            {/* Step 1 */}
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '20px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--grad-brand)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-glow)'
              }}>
                1
              </div>
              <h4 style={{ fontSize: '1.2rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>Create Care Profile</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Register your parent's profile, emergency contacts, primary physicians, and blood group in a central, secured vault.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '20px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--grad-brand)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-glow)'
              }}>
                2
              </div>
              <h4 style={{ fontSize: '1.2rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>Invite Family Members</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Share an invitation link or email invite with your brothers, sisters, and primary caregivers to join the team.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '20px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--grad-brand)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-glow)'
              }}>
                3
              </div>
              <h4 style={{ fontSize: '1.2rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>Schedule Care Duties</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Set up recurring medication routines, doctor visits, and vitals checks. View duties in calendar or list formats.
              </p>
            </div>

            {/* Step 4 */}
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '20px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--grad-brand)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-glow)'
              }}>
                4
              </div>
              <h4 style={{ fontSize: '1.2rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>Track & Settle Expenses</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Upload bill receipts, select categories, and let the system compute net balances and optimal settlement transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact-us" style={{ padding: '5rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="app-container">
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '3rem 0', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--grad-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HeartHandshake size={18} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Saath<span style={{ color: 'var(--accent-cyan)' }}>Care</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <a href="#what-we-do" style={{ color: 'inherit', textDecoration: 'none' }}>What We Do</a>
              <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How It Works</a>
              <a href="#contact-us" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Us</a>
              <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            © 2026 SaathCare Platform. Engineered for production-grade reliability, transparent accounting, and compassionate elder care.
          </div>
        </div>
      </footer>
    </div>
  );
}
