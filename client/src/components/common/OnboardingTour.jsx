import React, { useState } from 'react';
import {
  HeartHandshake,
  Users,
  CheckSquare,
  Receipt,
  Scale,
  ArrowRight,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import { authService } from '../../services/authService.js';

const STEPS = [
  {
    title: 'Welcome to SaathCare',
    subtitle: 'Coordinated Elder Care for Modern Families',
    description: 'SaathCare connects siblings and caregivers into a unified team. Whether you live across town or across oceans, coordinate daily medical duties and track healthcare costs with complete transparency.',
    icon: HeartHandshake,
    accentColor: 'var(--accent-cyan)',
    badge: 'Welcome'
  },
  {
    title: 'Care Recipient Profile',
    subtitle: 'Centralize Crucial Emergency & Medical Info',
    description: 'Keep your parent’s vital statistics, blood group, emergency contacts, primary physicians, and hospital preferences in a secure, accessible location visible to your entire care team.',
    icon: Users,
    accentColor: 'var(--accent-teal)',
    badge: 'Care Profile'
  },
  {
    title: 'Daily Care Duties',
    subtitle: 'Shared Accountability Without Second-Guessing',
    description: 'Assign medications, doctor visits, and vitals checks to specific siblings. SaathCare monitors schedule adherence with automated missed-task detection and real-time alerts.',
    icon: CheckSquare,
    accentColor: 'var(--accent-emerald)',
    badge: 'Duty Tracking'
  },
  {
    title: 'Append-Only Expense Ledger',
    subtitle: 'Integer-Paise Precision & Zero Financial Disputes',
    description: 'Record doctor visits, medicines, and attendant salaries. SaathCare uses an immutable ledger: entries are never silently edited or deleted. Errors are corrected via transparent reversal entries.',
    icon: Receipt,
    accentColor: 'var(--accent-amber)',
    badge: 'Financial Ledger'
  },
  {
    title: 'Instant Debt Settlement',
    subtitle: 'Greedy Algorithm Minimizes Sibling Transfers',
    description: 'At the end of the month, SaathCare computes net balances and calculates the minimal number of bank transfers needed to settle all shared expenses fairly.',
    icon: Scale,
    accentColor: 'var(--accent-cyan)',
    badge: 'Settle Up'
  }
];

export function OnboardingTour({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const IconComponent = step.icon;

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await authService.completeOnboarding();
    } catch (err) {
      console.warn('Failed to persist onboarding state on server:', err.message);
    } finally {
      setIsFinishing(false);
      onComplete?.();
      onClose?.();
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome Tour"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '2.25rem',
          position: 'relative',
          border: '1px solid var(--border-hover)',
          boxShadow: 'var(--shadow-glow)',
          animation: 'fadeIn 200ms ease-out'
        }}
      >
        {/* Skip / Close Button */}
        <button
          type="button"
          onClick={handleFinish}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.8rem'
          }}
          aria-label="Skip onboarding tour"
        >
          <span>Skip</span>
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <span
            className="badge badge-cyan"
            style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {step.badge}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step Graphic / Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--bg-tertiary)',
            border: `1px solid ${step.accentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <IconComponent size={32} color={step.accentColor} />
        </div>

        {/* Step Content */}
        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          {step.title}
        </h3>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '500', color: step.accentColor, marginBottom: '1rem' }}>
          {step.subtitle}
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.65', minHeight: '80px' }}>
          {step.description}
        </p>

        {/* Step Progress Dots */}
        <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0' }}>
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStep(idx)}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: 'var(--radius-full)',
                background: idx === currentStep ? step.accentColor : 'var(--border-subtle)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)'
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            style={{ opacity: currentStep === 0 ? 0.3 : 1 }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleNext}
            disabled={isFinishing}
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                <Check size={16} /> Get Started
              </>
            ) : (
              <>
                Next <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
