import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contactSchema } from '../../src/validators/contact.validators.js';
import { ContactService } from '../../src/services/contact.service.js';
import { ContactMessage } from '../../src/models/ContactMessage.js';
import { EmailService } from '../../src/services/email/index.js';

describe('Contact Us Form & Service Unit Tests (Phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates a complete and legitimate contact inquiry', () => {
    const payload = {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      subject: 'Inquiry regarding family elder care',
      message: 'Hello, our family is interested in setting up care for our mother.'
    };

    const res = contactSchema.safeParse(payload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe('Priya Sharma');
      expect(res.data.email).toBe('priya@example.com');
    }

    // Also accepts brief messages (e.g. 7-character 'nothing')
    const briefRes = contactSchema.safeParse({
      name: 'Saurabh GUPTA',
      email: 'soulfulbhakti4356@gmail.com',
      subject: "I can't see the expenses page",
      message: 'nothing'
    });
    expect(briefRes.success).toBe(true);
  });

  it('rejects contact payload missing required fields or invalid email', () => {
    const invalid = {
      name: '',
      email: 'invalid-email',
      subject: '',
      message: 'a' // less than 3 chars
    };

    const res = contactSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      const fields = res.error.errors.map(e => e.path[0]);
      expect(fields).toContain('name');
      expect(fields).toContain('email');
      expect(fields).toContain('subject');
      expect(fields).toContain('message');
    }
  });

  it('accepts optional honeypot field in schema for bot inspection', () => {
    const payloadWithHoneypot = {
      name: 'Spam Bot',
      email: 'spambot@example.com',
      subject: 'Buy cheap watches',
      message: 'Visit our spam link now please.',
      website_url: 'http://spamlink.com'
    };

    const res = contactSchema.safeParse(payloadWithHoneypot);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.website_url).toBe('http://spamlink.com');
    }
  });

  it('saves inquiry to database and dispatches notification email without throwing on email failure', async () => {
    const mockMessageDoc = {
      _id: '607f1f77bcf86cd799439099',
      name: 'Rohit Verma',
      email: 'rohit@example.com',
      subject: 'Assistance needed',
      message: 'Can you help us configure multi-sibling settlements?',
      emailSent: false,
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(ContactMessage, 'create').mockResolvedValue(mockMessageDoc);
    vi.spyOn(EmailService, 'sendEmail').mockRejectedValue(new Error('SMTP connection timed out'));

    const result = await ContactService.submitMessage({
      name: 'Rohit Verma',
      email: 'rohit@example.com',
      subject: 'Assistance needed',
      message: 'Can you help us configure multi-sibling settlements?'
    });

    expect(result).toBeDefined();
    expect(ContactMessage.create).toHaveBeenCalledTimes(1);
    expect(EmailService.sendEmail).toHaveBeenCalledTimes(1);
    // Request must succeed even if third-party email service has an issue
    expect(result.emailSent).toBe(false);
  });
});
