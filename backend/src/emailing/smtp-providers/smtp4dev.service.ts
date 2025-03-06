import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, Transporter } from 'nodemailer';
import { IcalAttachment } from 'nodemailer/lib/mailer';
import { ISmtpService } from '../interfaces/ismtp-service';

@Injectable()
export class Smtp4devService implements ISmtpService {
  private transporter: Transporter;

  constructor(configService: ConfigService) {
    const host = configService.get("SMTP4DEV_HOST");
    const port = configService.get("SMTP4DEV_PORT");
    this.transporter = createTransport({
      host,
      port,
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