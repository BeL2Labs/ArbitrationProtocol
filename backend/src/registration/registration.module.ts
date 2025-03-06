import { Module } from '@nestjs/common';
import { EmailingModule } from 'src/emailing/emailing.module';
import { EvmModule } from 'src/evm/evm.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';

@Module({
  controllers: [RegistrationController],
  providers: [RegistrationService],
  imports: [
    PrismaModule,
    EvmModule,
    EmailingModule
  ]
})
export class RegistrationModule { }
