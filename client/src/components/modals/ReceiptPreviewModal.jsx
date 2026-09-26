import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw, ExternalLink, FileText } from 'lucide-react';
import { formatPaiseToINR } from '../../utils/currency.js';

export function ReceiptPreviewModal({ isOpen, onClose, receiptUrl, expense }) {
  const [scale, setScale] = useState(1);

  if (!isOpen || !receiptUrl) return null;

  const isPdf = receiptUrl.toLowerCase().includes('.pdf') || expense?.attachment?.mimeType === 'application/pdf';

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          border: '1px solid var(--border-hover)',
          boxShadow: 'var(--shadow-glow)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                {expense?.description || 'Receipt Document'}
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Amount: <strong style={{ color: 'var(--text-primary)' }}>{expense ? formatPaiseToINR(expense.amountPaise) : ''}</strong> • Paid by {expense?.paidById?.name || 'Member'}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isPdf && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  <ZoomIn size={15} />
                </button>
              </>
            )}

            <a
              href={receiptUrl}
              download={expense?.attachment?.filename || 'receipt'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Open / Download Document"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem' }}
            >
              <Download size={15} />
              Download
            </a>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.4rem 0.6rem' }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div style={{
          flex: 1,
          background: 'rgba(0, 0, 0, 0.4)',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          position: 'relative'
        }}>
          {isPdf ? (
            <iframe
              src={receiptUrl}
              title="Receipt PDF"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 'var(--radius-md)'
              }}
            />
          ) : (
            <img
              src={receiptUrl}
              alt="Receipt attachment"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 150ms ease-out',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
