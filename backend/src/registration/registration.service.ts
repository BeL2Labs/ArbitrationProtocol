import { HttpException, Injectable } from '@nestjs/common';
import { getAddress } from 'ethers';
import { list, random } from "radash";
import { EmailTemplateType } from 'src/emailing/email-template-type';
import { EmailingService } from 'src/emailing/emailing.service';
import { EvmService } from 'src/evm/evm.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArbiterRegistrationResultDTO } from './dto/arbiter-registration-result.dto';
import { ArbiterRegistrationDTO } from './dto/arbiter-registration.dto';
import { ArbiterStatusDTO } from './dto/arbiter-status.dto';
import { EmailVerificationDTO } from './dto/email-verification.dto';

@Injectable()
export class RegistrationService {
  constructor(
    private prisma: PrismaService,
    private evm: EvmService,
    private emailing: EmailingService
  ) { }

  public async getArbiterStatus(arbiterOwnerAddress: string): Promise<ArbiterStatusDTO> {
    const arbiter = await this.prisma.arbiter.findFirst({
      where: { ownerEvmAddress: arbiterOwnerAddress }
    });

    return { arbiterOwnerAddress, emailKnown: !!arbiter?.email };
  }

  public async processArbiterRegistration(registrationDTO: ArbiterRegistrationDTO): Promise<ArbiterRegistrationResultDTO> {
    const { email, evmChallengePayload, signature } = registrationDTO;
    let { ownerAddress } = registrationDTO;

    // Ensure no missing parameters
    if (!ownerAddress || !email || !evmChallengePayload || !signature)
      throw new HttpException("Missing parameters", 403);

    // Ensure checksum address format
    ownerAddress = getAddress(ownerAddress);

    // Ensure signature is valid
    if (!this.evm.isSignatureValid(evmChallengePayload, signature, ownerAddress))
      throw new HttpException("Invalid signature", 403);

    // Create a temporary pin code
    const emailVerificationPin = list(3).map(() => Math.round(random(0, 9))).join('');
    console.log("pin", emailVerificationPin);
    const emailVerificationPinExpiration = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes
    const emailToVerify = email;

    // Save temporary verification request
    await this.prisma.arbiter.upsert({
      where: { ownerEvmAddress: ownerAddress },
      update: {
        emailToVerify,
        emailVerificationPin,
        emailVerificationPinExpiration,
        emailVerificationAttempts: 0
      },
      create: {
        ownerEvmAddress: ownerAddress,
        emailToVerify,
        emailVerificationPin,
        emailVerificationPinExpiration,
        emailVerificationAttempts: 0
      }
    });

    // Send email to arbiter owner
    if (!await this.emailing.sendEmail(
      EmailTemplateType.EMAIL_VERIFICATION,
      undefined, // Automatic
      emailToVerify,
      "Verify your arbiter email address",
      { pinCode: emailVerificationPin }
    )) {
      throw new HttpException(`Failed to send email`, 500);
    }

    return { result: "pin-verification-required" };
  }

  /**
   * To call when user submits the pin code after receiving it by email, so we can 
   * mark the arbiter email address as verified.
   */
  public async checkEmailVerificationPin(request: EmailVerificationDTO): Promise<ArbiterStatusDTO> {
    if (!request?.arbiterAddress || !request?.pinCode)
      throw new HttpException(`Missing parameters`, 403);

    // Retrieve arbiter
    const arbiter = await this.prisma.arbiter.findFirst({
      where: { ownerEvmAddress: request.arbiterAddress }
    });

    if (!arbiter)
      throw new HttpException(`Unknown arbiter`, 404);

    // Ensure there is an email to verify
    if (!arbiter.emailToVerify || !arbiter.emailVerificationPin)
      throw new HttpException(`No on going email verification`, 401);

    // Ensure not too many failed attempts
    if (arbiter.emailVerificationAttempts >= 3)
      throw new HttpException(`Too many attempts`, 401);

    // Ensure valid pin
    if (arbiter.emailVerificationPin !== request.pinCode) {
      // Increment attempt counter
      await this.prisma.arbiter.update({
        where: { ownerEvmAddress: request.arbiterAddress },
        data: { emailVerificationAttempts: arbiter.emailVerificationAttempts + 1 }
      });

      throw new HttpException(`Invalid pin`, 401);
    }

    // Ensure pin is not expired
    if (arbiter.emailVerificationPinExpiration! < new Date())
      throw new HttpException(`Expired. Please request a new pin`, 401);

    // All good, mark as verified
    await this.prisma.arbiter.update({
      where: { ownerEvmAddress: request.arbiterAddress },
      data: {
        email: arbiter.emailToVerify!,
        emailVerifiedAt: new Date(),
        emailVerificationAttempts: 0,
        emailVerificationPin: null,
        emailToVerify: null
      }
    });

    return this.getArbiterStatus(request.arbiterAddress);
  }
}
