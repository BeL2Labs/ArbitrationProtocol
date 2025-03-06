import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter, createTransport } from 'nodemailer';
import { IcalAttachment } from 'nodemailer/lib/mailer';
import { ISmtpService } from '../interfaces/ismtp-service';

@Injectable()
export class ZohoService implements ISmtpService {
  private readonly HOST = 'smtppro.zoho.com';
  private readonly PORT = 465;

  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = createTransport({
      host: this.HOST,
      port: this.PORT,
      secure: true, // true for 465, false for other ports
      tls: {
        rejectUnauthorized: false // Do not fail on invalid certs
      },
      auth: {
        user: this.config.get("ZOHO_USERNAME"),
        pass: this.config.get("ZOHO_PASSWORD")
      }
    });
  }

  async sendEmail(from: string, to: string[], subject, htmlContent: string, textContent: string, calendarEvent?: IcalAttachment): Promise<void> {
    await this.transporter.sendMail({
      from, to, subject,
      html: htmlContent,
      text: textContent,
    });
  }
}