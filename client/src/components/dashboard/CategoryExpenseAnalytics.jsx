import React from 'react';
import { formatPaiseToINR } from '../../utils/currency.js';
import {
  Pill,
  Stethoscope,
  Wrench,
  ShoppingCart,
  UserCheck,
  Car,
  Utensils,
  CreditCard,
  HelpCircle,
  PieChart
} from 'lucide-react';

const CATEGORY_CONFIG = {
  MEDICINE: { label: 'Medications & Pharmacy', color: '#38bdf8', icon: Pill },
  MEDICATION: { label: 'Medications & Pharmacy', color: '#38bdf8', icon: Pill },
  DOCTOR: { label: 'Doctor & Consultations', color: '#10b981', icon: Stethoscope },
  EQUIPMENT: { label: 'Medical Devices & Equipment', color: '#8b5cf6', icon: Wrench },
  CAREGIVER: { label: 'Attendant & Nursing Salaries', color: '#f59e0b', icon: UserCheck },
  GROCERY: { label: 'Groceries & Essentials', color: '#14b8a6', icon: ShoppingCart },
  FOOD: { label: 'Special Diets & Food', color: '#f43f5e', icon: Utensils },
  TRANSPORT: { label: 'Ambulance & Transport', color: '#6366f1', icon: Car },
  BILLS: { label: 'Hospital & Utility Bills', color: '#f97316', icon: CreditCard },
  OTHER: { label: 'Other Miscellaneous', color: '#94a3b8', icon: HelpCircle }
};

export function CategoryExpenseAnalytics({ expenses }) {
  const activeExpenses = expenses.filter(e => !e.isReversal);
  const totalPaise = activeExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

  // Group by category
  const breakdownMap = {};
  activeExpenses.forEach(e => {
    const cat = e.category || 'OTHER';
    breakdownMap[cat] = (breakdownMap[cat] || 0) + e.amountPaise;
  });

  const categoriesWithSpending = Object.entries(breakdownMap)
    .map(([cat, amountPaise]) => {
      const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.OTHER;
      const pct = totalPaise > 0 ? (amountPaise / totalPaise) * 100 : 0;
      return {
        key: cat,
        label: config.label,
        color: config.color,
        icon: config.icon,
        amountPaise,
        percentage: pct
      };
    })
    .sort((a, b) => b.amountPaise - a.amountPaise);

  if (activeExpenses.length === 0 || totalPaise === 0) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PieChart size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>
              Spending Breakdown by Category
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Care Outlay: {formatPaiseToINR(totalPaise)} across {activeExpenses.length} entries
            </span>
          </div>
        </div>
      </div>

      {/* Multi-segmented distribution bar */}
      <div style={{
        width: '100%',
        height: '10px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        overflow: 'hidden',
        marginBottom: '1.25rem'
      }}>
        {categoriesWithSpending.map(cat => (
          <div
            key={cat.key}
            style={{
              width: `${cat.percentage}%`,
              background: cat.color,
              transition: 'width 300ms ease'
            }}
            title={`${cat.label}: ${cat.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Category breakdown items */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
        gap: '0.85rem'
      }}>
        {categoriesWithSpending.map(cat => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.key}
              style={{
                padding: '0.75rem 0.85rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: `${cat.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} color={cat.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {cat.percentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '0.875rem' }}>
                {formatPaiseToINR(cat.amountPaise)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
