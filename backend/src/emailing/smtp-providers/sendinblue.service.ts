import { Injectable, Logger } from '@nestjs/common';
import { IcalAttachment } from 'nodemailer/lib/mailer';
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from "sib-api-v3-typescript";
import { SendSmtpEmail } from 'sib-api-v3-typescript/model/sendSmtpEmail';
import { ISmtpService } from '../interfaces/ismtp-service';

@Injectable()
export class SendinblueService implements ISmtpService {
  private logger = new Logger('SendInblue');
  private transactionalEmailsApi: TransactionalEmailsApi;

  constructor() {
    this.transactionalEmailsApi = new TransactionalEmailsApi();
    this.transactionalEmailsApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.SENDINBLUE_API_KEY as string);
  }

  async sendEmail(sender: string, to: string[], subject: string, htmlContent: string, textContent: string, calendarEvent?: IcalAttachment): Promise<void> {
    this.logger.debug(`SendinblueService.sendEmail, ${sender}, ${to.join(", ")}, ${subject}, ${htmlContent}, ${calendarEvent}`);
    const mailData: SendSmtpEmail = {
      sender: { email: sender },
      to: to.map(t => ({ email: t })),
      subject: subject,
      htmlContent,
      textContent
    }
    if (calendarEvent) {
      if (typeof calendarEvent.filename !== 'string' || typeof calendarEvent.content !== 'string')
        throw new Error('SendinblueService.sendEmail: Unsupported values of calendarEvent');

      mailData.attachment = [{
        name: calendarEvent.filename,
        content: btoa((calendarEvent.content as string).replace(/\r\n/g, '\n')),
      }]
    }
    void await this.transactionalEmailsApi.sendTransacEmail(mailData);
  }
}