import React, { useState } from 'react';
import { contactService } from '../../services/contactService.js';
import { Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website_url: '' // Honeypot
  });

  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedMessage = formData.message.trim();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !trimmedMessage) {
      setStatus('error');
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (trimmedMessage.length < 3) {
      setStatus('error');
      setErrorMessage('Message must be at least 3 characters.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await contactService.submitContact(formData);
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        website_url: ''
      });
    } catch (err) {
      setStatus('error');

      let errorMsg = 'Failed to submit your message. Please try again.';

      // Extract specific details from Zod validation or backend ApiError
      const details = err?.details || err?.response?.data?.error?.details || err?.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        errorMsg = details.map(d => d.message).join('. ');
      } else {
        errorMsg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          err?.error?.message ||
          'Failed to submit your message. Please try again.';
      }

      setErrorMessage(errorMsg);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '640px', margin: '0 auto', padding: '2.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Get in Touch</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Have questions about coordinating elder care or setting up your family ledger? Send us an inquiry.
        </p>
      </div>

      {status === 'success' ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)'
        }}>
          <CheckCircle2 size={48} color="var(--accent-emerald)" style={{ margin: '0 auto 1rem auto' }} />
          <h4 style={{ fontSize: '1.25rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
            Message Sent Successfully
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Thank you for reaching out. We have saved your message and sent a confirmation to your email. Our support team will reply shortly.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setStatus('idle')}
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {status === 'error' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fb7185',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Honeypot field (hidden from screen readers & human users) */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="contact_website_url">Do not fill this field</label>
            <input
              type="text"
              id="contact_website_url"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="contact-name">Your Name *</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g. Priya Sharma"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={100}
                disabled={status === 'submitting'}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-email">Email Address *</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className="form-control"
                placeholder="priya@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                maxLength={255}
                disabled={status === 'submitting'}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact-subject">Subject *</label>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              className="form-control"
              placeholder="Question about family ledger or duty assignment"
              value={formData.subject}
              onChange={handleChange}
              required
              maxLength={200}
              disabled={status === 'submitting'}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact-message">Message *</label>
            <textarea
              id="contact-message"
              name="message"
              className="form-control"
              rows={5}
              placeholder="Tell us about your family care coordination requirements..."
              value={formData.message}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={5000}
              disabled={status === 'submitting'}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <RefreshCw size={18} className="spin" />
                Sending Inquiry...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Inquiry
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
