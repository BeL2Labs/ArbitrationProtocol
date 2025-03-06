import { IcalAttachment } from 'nodemailer/lib/mailer';

export interface ISmtpService {
  /**
   * Send email.
   * @param from from an email address
   * @param to to the addresses list.
   * @param subject email subject.
   * @param htmlContent email content, html format.
   * @param textContent email content, text format.
   * @param calendarEvent email attachment.
   */
  sendEmail(from: string, to: string[], subject, htmlContent: string, textContent: string, calendarEvent?: IcalAttachment): Promise<void>;
}