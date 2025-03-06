import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { IcalAttachment } from 'nodemailer/lib/mailer';
import { ISmtpService } from '../interfaces/ismtp-service';

@Injectable()
export class ProtonMailService implements ISmtpService {
  private readonly HOST = '127.0.0.1 TODO';
  private readonly PORT = 925;

  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: this.HOST,
      port: this.PORT,
      secure: false, // true for 465, false for other ports
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      },
      //logger: true,
      //debug: true
    });
  }

  async sendEmail(from: string, to: string[], subject, htmlContent: string, textContent: string, calendarEvent?: IcalAttachment): Promise<void> {
    const info = await this.transporter.sendMail({
      from, to, subject,
      html: htmlContent,
      text: textContent,
      icalEvent: calendarEvent
      //text: "Hello world?", // plain text body
    });
  }
}