import { Controller, Get, Param } from '@nestjs/common';
import arbitrationRequestPlaceholder from "../../assets/email-placeholders/arbitration-request.json";
import emailVerificationPlaceholder from "../../assets/email-placeholders/email-verification.json";
import { EmailTemplateType } from './email-template-type';
import { EmailingService } from './emailing.service';

@Controller('emailingdev')
export class EmailingDevController {
  constructor(private emailingService: EmailingService) { }

  @Get('preview/:templateType')
  public downloadFile(@Param('templateType') templateTypeKey: EmailTemplateType) {
    const availableTypes = Object.keys(EmailTemplateType);
    if (!availableTypes.includes(templateTypeKey)) {
      return `Inexisting template type ${templateTypeKey}. Choose among ${availableTypes.join(", ")}.`;
    }

    const templateType = EmailTemplateType[templateTypeKey] as EmailTemplateType;
    return this.emailingService.templatify(templateType, {
      ...this.emailingService.getGenericTemplateData(),
      ...this.getPlaceholderData(templateType)
    }, true)
  }

  private getPlaceholderData(templateType: EmailTemplateType) {
    switch (templateType) {
      case EmailTemplateType.ARBITRATION_REQUEST:
        return arbitrationRequestPlaceholder;
      case EmailTemplateType.EMAIL_VERIFICATION:
        return emailVerificationPlaceholder;
      default:
        return {};
    }
  }
}