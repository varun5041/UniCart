import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter: Transporter | null = null;

/**
 * Returns or initializes the nodemailer transport.
 * Uses Ethereal test account in development/test if no explicit SMTP is provided.
 */
export async function getEmailTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  if (env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development / Test: Ethereal test account or local json transport
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
      logger.info({
        msg: '[Email] Initialized Ethereal SMTP test transporter',
        user: testAccount.user
      });
    } catch {
      logger.warn('[Email] Falling back to JSON/stream test transporter');
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }

  return transporter;
}

export interface WelcomeEmailData {
  email: string;
  name: string;
}

export interface OrderItemSummary {
  name: string;
  qty: number;
  price: number; // in paise
}

export interface OrderConfirmationData {
  email: string;
  orderId: string;
  total: number; // in paise
  items: OrderItemSummary[];
}

/**
 * Sends a welcome email to newly registered users.
 */
export async function sendWelcomeEmailMessage(data: WelcomeEmailData) {
  const mailer = await getEmailTransporter();

  const mailOptions = {
    from: '"UniCart Marketplace" <no-reply@unicart.local>',
    to: data.email,
    subject: `Welcome to UniCart, ${data.name}!`,
    text: `Hi ${data.name},\n\nWelcome to UniCart! Your account has been created successfully.\nHappy shopping!\n\nThe UniCart Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Welcome to UniCart!</h2>
        <p>Hi <strong>${data.name}</strong>,</p>
        <p>Thank you for joining UniCart. Your account is ready and verified.</p>
        <p>Explore thousands of curated products at unbeatable prices.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">UniCart Platform &bull; Secure, Scalable E-commerce</p>
      </div>
    `
  };

  const info = await mailer.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  logger.info({
    msg: '[Email] Welcome email sent successfully',
    to: data.email,
    messageId: info.messageId,
    previewUrl: previewUrl || undefined
  });

  return info;
}

/**
 * Sends an order confirmation email to the purchasing customer.
 */
export async function sendOrderConfirmationMessage(data: OrderConfirmationData) {
  const mailer = await getEmailTransporter();
  const formattedTotal = (data.total / 100).toFixed(2);

  const itemsHtml = (data.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price / 100).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const mailOptions = {
    from: '"UniCart Orders" <orders@unicart.local>',
    to: data.email,
    subject: `Order Confirmation #${data.orderId.slice(-8)} — UniCart`,
    text: `Thank you for your order!\n\nOrder ID: ${data.orderId}\nTotal: ₹${formattedTotal}\n\nWe are preparing your items for delivery.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #16a34a;">Order Confirmed!</h2>
        <p>Your order <strong>#${data.orderId}</strong> has been received and is being processed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f9fafb; text-align: left;">
              <th style="padding: 8px;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 8px; font-weight: bold; text-align: right;">Total Paid:</td>
              <td style="padding: 12px 8px; font-weight: bold; text-align: right; color: #16a34a;">₹${formattedTotal}</td>
            </tr>
          </tfoot>
        </table>
        <p style="font-size: 13px; color: #4b5563;">You will receive another update when your shipment is on its way.</p>
      </div>
    `
  };

  const info = await mailer.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  logger.info({
    msg: '[Email] Order confirmation email sent successfully',
    to: data.email,
    orderId: data.orderId,
    previewUrl: previewUrl || undefined
  });

  return info;
}
