import { Injectable, Logger } from '@nestjs/common';
import { IcalAttachment } from 'nodemailer/lib/mailer';
import { ServerClient } from "postmark";
import { ISmtpService } from '../interfaces/ismtp-service';

@Injectable()
export class PostmarkService implements ISmtpService {
  private logger = new Logger('Postmark');
  private client: ServerClient;

  constructor() {
    const apiKey = process.env.POSTMARK_SERVER_TOKEN as string;
    if (apiKey) {
      try {
        this.client = new ServerClient(process.env.POSTMARK_SERVER_TOKEN as string);
      }
      catch (e) {
        this.logger.warn("Postmark client initialization error", e);
      }
    }
  }

  async sendEmail(sender: string, to: string[], subject: string, htmlContent: string, textContent: string, calendarEvent?: IcalAttachment): Promise<void> {
    this.logger.debug(`PostmarkService.sendEmail, ${sender}, ${to.join(', ')}, ${subject}`);

    if (calendarEvent && (typeof calendarEvent.filename !== 'string' || typeof calendarEvent.content !== 'string'))
      throw new Error('Postmark sendEmail: Unsupported calendarEvent values');

    try {
      await this.client.sendEmail({
        From: sender,
        To: to.join(", "),
        Subject: subject,
        TextBody: textContent,
        HtmlBody: htmlContent,
        ...(calendarEvent && {
          Attachments: [
            {
              Name: calendarEvent.filename || "invite.ics",
              ContentID: null,
              Content: Buffer.from(calendarEvent.content!.toString().replace(/\r\n/g, '\n')).toString('base64'),
              ContentType: "text/calendar; charset=utf-8; method=" + calendarEvent.method
            }
          ]
        })
      });
    }
    catch (e) {
      this.logger.warn("Postmark send email error", e);
    }
  }
}