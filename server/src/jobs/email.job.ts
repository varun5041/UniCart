import nodemailer, { Transporter } from 'nodemailer';
import { getEmailQueue } from './queue.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { isRedisConnected } from '../config/redis.js';

export interface OrderEmailItem {
  name: string;
  qty: number;
  price: number;
}

export interface OrderEmailPayload {
  orderId: string;
  userId: string;
  total: number;
  items: OrderEmailItem[];
  customerEmail?: string;
}

let transporter: Transporter | null = null;

export async function getEmailTransporter(): Promise<Transporter> {
  if (!transporter) {
    if (env.NODE_ENV === 'test') {
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    } else {
      // In development/production: create test account or SMTP
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      } catch {
        // Fallback to json transport
        transporter = nodemailer.createTransport({ jsonTransport: true });
      }
    }
  }
  return transporter;
}

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<boolean> {
  try {
    const mailClient = await getEmailTransporter();
    const formattedTotal = (payload.total / 100).toFixed(2);
    const itemList = payload.items
      .map((i) => `  - ${i.name} × ${i.qty} (₹${(i.price / 100).toFixed(2)})`)
      .join('\n');

    const info = await mailClient.sendMail({
      from: '"UniCart Store" <orders@unicart.dev>',
      to: payload.customerEmail || 'customer@unicart.dev',
      subject: `Order Confirmation #${payload.orderId}`,
      text: `Thank you for your order!\n\nOrder ID: ${payload.orderId}\nTotal: ₹${formattedTotal}\n\nItems:\n${itemList}\n\nWe will notify you when your order ships!`,
      html: `<h2>Thank you for your order!</h2><p><strong>Order ID:</strong> ${payload.orderId}</p><p><strong>Total:</strong> ₹${formattedTotal}</p><pre>${itemList}</pre>`
    });

    logger.info(
      { orderId: payload.orderId, messageId: info.messageId },
      '[Worker] Order confirmation email sent successfully'
    );
    return true;
  } catch (err) {
    logger.error(
      { orderId: payload.orderId, err: (err as Error).message },
      '[Worker] Failed to send order confirmation email'
    );
    throw err;
  }
}

/**
 * Enqueues an order confirmation email job into BullMQ
 */
export async function enqueueOrderEmail(payload: OrderEmailPayload): Promise<void> {
  try {
    // If running in test and Redis is not available, log and return
    if (env.NODE_ENV === 'test' && !isRedisConnected()) {
      logger.info({ orderId: payload.orderId }, '[Job Producer] (Test bypass) Email job dispatched');
      return;
    }

    const queue = getEmailQueue();
    await queue.add('order_confirmation', payload, {
      jobId: `email_order_${payload.orderId}`
    });

    logger.info({ orderId: payload.orderId }, '[Job Producer] Order confirmation email enqueued');
  } catch (err) {
    logger.warn(
      { orderId: payload.orderId, err: (err as Error).message },
      '[Job Producer] Failed to enqueue email job (non-fatal)'
    );
  }
}

export default { enqueueOrderEmail, sendOrderConfirmationEmail, getEmailTransporter };
