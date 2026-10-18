import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendWelcomeEmailMessage,
  sendOrderConfirmationMessage,
  getEmailTransporter
} from '../src/jobs/email.job.js';
import {
  defaultJobOptions,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  getEmailQueue
} from '../src/jobs/queue.js';

describe('Phase 7 Acceptance: Background Worker Queue & Email Processing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Queue Configuration & Retry Strategy', () => {
    it('enforces 3 attempts with exponential backoff strategy', () => {
      expect(defaultJobOptions.attempts).toBe(3);
      expect(defaultJobOptions.backoff).toEqual({
        type: 'exponential',
        delay: 2000
      });
      expect(defaultJobOptions.removeOnComplete).toBe(100);
      expect(defaultJobOptions.removeOnFail).toBe(500);
    });

    it('enqueues welcome email with proper job name and payload', async () => {
      const mockQueue = {
        add: vi.fn().mockResolvedValue({ id: 'job-welcome-123' })
      };
      vi.spyOn(mockQueue, 'add');

      const queue = getEmailQueue();
      vi.spyOn(queue, 'add').mockResolvedValue({ id: 'job-welcome-123' } as any);

      const job = await sendWelcomeEmail({
        email: 'newuser@example.com',
        name: 'New User'
      });

      expect(job).toBeDefined();
      expect(job?.id).toBe('job-welcome-123');
      expect(queue.add).toHaveBeenCalledWith(
        'welcome_email',
        { email: 'newuser@example.com', name: 'New User' }
      );
    });

    it('enqueues order confirmation email with proper job name and payload', async () => {
      const queue = getEmailQueue();
      vi.spyOn(queue, 'add').mockResolvedValue({ id: 'job-order-456' } as any);

      const job = await sendOrderConfirmationEmail({
        email: 'shopper@example.com',
        orderId: '65d21e84f509170321a5a999',
        total: 149900,
        items: [{ name: 'Wireless Headphones', qty: 1, price: 149900 }]
      });

      expect(job).toBeDefined();
      expect(job?.id).toBe('job-order-456');
      expect(queue.add).toHaveBeenCalledWith(
        'order_confirmation',
        expect.objectContaining({
          email: 'shopper@example.com',
          orderId: '65d21e84f509170321a5a999'
        })
      );
    });
  });

  describe('Nodemailer Message Generators', () => {
    it('dispatches welcome email via transporter without errors', async () => {
      const transporter = await getEmailTransporter();
      vi.spyOn(transporter, 'sendMail').mockResolvedValue({
        messageId: '<test-message-1@unicart.local>',
        response: '250 Ok'
      } as any);

      const result = await sendWelcomeEmailMessage({
        email: 'welcome@example.com',
        name: 'John Doe'
      });

      expect(result).toBeDefined();
      expect(result.messageId).toBe('<test-message-1@unicart.local>');
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'welcome@example.com',
          subject: expect.stringContaining('Welcome to UniCart')
        })
      );
    });

    it('dispatches order confirmation email with formatted rupee amounts and table', async () => {
      const transporter = await getEmailTransporter();
      vi.spyOn(transporter, 'sendMail').mockResolvedValue({
        messageId: '<test-message-2@unicart.local>',
        response: '250 Ok'
      } as any);

      const result = await sendOrderConfirmationMessage({
        email: 'buyer@example.com',
        orderId: 'ORD-9876543210',
        total: 250000, // ₹2500.00
        items: [
          { name: 'Ergonomic Keyboard', qty: 1, price: 200000 },
          { name: 'Mouse Pad', qty: 1, price: 50000 }
        ]
      });

      expect(result).toBeDefined();
      expect(result.messageId).toBe('<test-message-2@unicart.local>');
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'buyer@example.com',
          subject: expect.stringContaining('ORD-9876543210'),
          html: expect.stringContaining('₹2500.00')
        })
      );
    });
  });
});
