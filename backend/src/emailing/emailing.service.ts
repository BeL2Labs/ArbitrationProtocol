import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import validateEmail from 'deep-email-validator';
import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { convert as htmlToText } from "html-to-text";
import { cloneDeep } from 'lodash';
import { IcalAttachment } from 'nodemailer/lib/mailer';
import { join } from 'path';
import { AppService } from 'src/app.service';
import fillPlaceholders from "string-placeholder";
import { EmailTemplateType } from './email-template-type';
import { ISmtpService } from './interfaces/ismtp-service';
import { PostmarkService } from './smtp-providers/postmark.service';
import { ProtonMailService } from './smtp-providers/protonmail.service';
import { SendinblueService } from './smtp-providers/sendinblue.service';
import { Smtp4devService } from './smtp-providers/smtp4dev.service';
import { ZohoService } from './smtp-providers/zoho.service';

enum SmtpService {
  //MAILHOG = "mailhog" // local mailhog docker smtp to simply debug emails without really sending them
  SMTP4DEV = "smtp4dev", // local smtp4dev docker smtp to simply debug emails without really sending them
  SENDINBLUE = "sendinblue", // real smtp service
  PROTONMAIL = "protonmail", // proton.me
  POSTMARK = "postmark",
  ZOHO = "zoho"
}

export type EmailContentReplacements = {
  [placeholder: string]: string; // placeholder -> real value pairs
}

@Injectable()
export class EmailingService {
  private logger = new Logger(EmailingService.name);
  private templates: { [templateName: string]: HandlebarsTemplateDelegate } = {};

  constructor(
    private config: ConfigService,
    private appService: AppService,
    private smtp4devService: Smtp4devService,
    private sendinblueService: SendinblueService,
    private protonMailService: ProtonMailService,
    private postmarkService: PostmarkService,
    private zohoService: ZohoService
  ) {
    Handlebars.registerHelper('breaklines', function (text: string) {
      text = Handlebars.Utils.escapeExpression(text);
      text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
      return new Handlebars.SafeString(text);
    });

    this.registerHandlebarsPartials();
    this.loadTemplates();
  }

  private registerHandlebarsPartials() {
    Handlebars.registerPartial('mainMeta', this.loadHandlebarsPart("main-meta"));
    Handlebars.registerPartial('mainStyle', this.loadHandlebarsPart("main-style"));
    Handlebars.registerPartial('header', this.loadHandlebarsPart("header"));
    Handlebars.registerPartial('footer', this.loadHandlebarsPart("footer"));
  }

  private loadHandlebarsPart(partName: string): string {
    return readFileSync(join(process.cwd(), `assets/email-templates-parts/${partName}.hbs`)).toString("utf-8")
  }

  private loadTemplates() {

    for (const key of Object.values(EmailTemplateType)) {
      this.loadTemplate(<EmailTemplateType>key);
    }
  }

  private loadTemplate(templateType: EmailTemplateType) {
    this.templates[templateType] = Handlebars.compile(readFileSync(join(process.cwd(), `assets/email-templates/${templateType}.hbs`)).toString("utf-8"));
  }

  /**
   * Return the html result after applying data to the given email template
   */
  public templatify(templateType: EmailTemplateType, data, forceReloadTemplate = false): string {
    if (forceReloadTemplate)
      this.loadTemplate(templateType);

    return this.templates[templateType](data);
  }

  public getGenericTemplateData() {
    return {
      headerLogo: this.appService.publicUrl('logo-with-text.png')
    }
  }

  private async canSendEmailTo(email: string): Promise<boolean> {
    const res = await validateEmail({
      email,
      validateRegex: true,
      validateMx: true,
      validateTypo: false,
      validateDisposable: true,
      validateSMTP: false, // Services like hotmail return "Mailbox not found" on purpose, probably against bots, so we can't rely on this
    });

    if (!res.valid)
      this.logger.warn("Won't send email to:", email, res);

    return res.valid;
  }

  public async sendEmail(emailTemplate: EmailTemplateType, from: string | undefined = undefined, to: string | Array<string>, subject: string, data: { [key: string]: any }, calendarEvent?: IcalAttachment): Promise<boolean> {
    if (!(emailTemplate in this.templates)) {
      throw new Error(`Email template of given type ${emailTemplate} does not exist. Did you forget to load it in the emailing service?`);
    }

    if (!from)
      from = this.config.get("EMAIL_SENDER_ADDRESS")!;

    // Clone input data to avoid modification before sending
    data = cloneDeep(data);

    // Verify emails as best as we can
    const destinationCandidates = to instanceof Array ? to : [to];
    const verifiedDestinations: string[] = [];
    for (const email of destinationCandidates) {
      if (await this.canSendEmailTo(email))
        verifiedDestinations.push(email);
    }

    if (verifiedDestinations.length === 0)
      return false; // TODO: USER FRIENDLY ERROR MESSAGE TO TELL WHY THIS HAS FAILED

    // Append generic data
    data = {
      ...this.getGenericTemplateData(),
      ...data,
    }

    const htmlContent = this.templates[emailTemplate](data);
    const textContent: string = htmlToText(htmlContent);

    try {
      await this.getSmtpService().sendEmail(from, verifiedDestinations, subject, htmlContent, textContent, calendarEvent);
      return true;
    } catch (e) {
      this.logger.error('Failed to send email');
      console.error(e);
      return false;
    }
  }

  private getSmtpService(): ISmtpService {
    const service = this.config.get("EMAIL_PROVIDER");
    switch (service) {
      case SmtpService.SMTP4DEV:
        return this.smtp4devService;
      case SmtpService.SENDINBLUE:
        return this.sendinblueService;
      case SmtpService.PROTONMAIL:
        return this.protonMailService;
      case SmtpService.POSTMARK:
        return this.postmarkService;
      case SmtpService.ZOHO:
        return this.zohoService;
      default:
        throw new Error(`Unknown STMP service ${service}`)
    }
  }

  /**
   * Search the given content for placeholders providers as keys of "replacements" and replaces
   * them with key values from "replacements".
   *
   * Placeholders format in content: {{myVar}}
   */
  public fillEmailContentPlaceholders(content: string, replacements: EmailContentReplacements): string {
    return fillPlaceholders(content, replacements, {
      before: '{{',
      after: '}}'
    });
  }
}
