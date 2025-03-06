import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ArbiterRegistrationDTO } from './dto/arbiter-registration.dto';
import { ArbiterStatusDTO } from './dto/arbiter-status.dto';
import { EmailVerificationDTO } from './dto/email-verification.dto';
import { RegistrationService } from './registration.service';

@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) { }

  @Get('arbiter/status')
  public getArbiterStatus(@Query('owner') arbiterOwnerAddress: string): Promise<ArbiterStatusDTO> {
    return this.registrationService.getArbiterStatus(arbiterOwnerAddress);
  }

  @Post('arbiter')
  public async upsertArbiter(@Body() registrationDTO: ArbiterRegistrationDTO) {
    return this.registrationService.processArbiterRegistration(registrationDTO);
  }

  @Post('arbiter/email-verification')
  public async checkEmailVerificationPin(@Body() request: EmailVerificationDTO) {
    return await this.registrationService.checkEmailVerificationPin(request);
  }
}
