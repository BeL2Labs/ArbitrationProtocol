import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from 'src/app.module';
import { EmailingDevController } from './emailing-dev.controller';
import { EmailingService } from './emailing.service';
import { PostmarkService } from './smtp-providers/postmark.service';
import { ProtonMailService } from './smtp-providers/protonmail.service';
import { SendinblueService } from './smtp-providers/sendinblue.service';
import { Smtp4devService } from './smtp-providers/smtp4dev.service';
import { ZohoService } from './smtp-providers/zoho.service';

@Module({
  exports: [
    EmailingService
  ],
  providers: [
    EmailingService,
    SendinblueService,
    Smtp4devService,
    ProtonMailService,
    PostmarkService,
    ZohoService
  ],
  imports: [
    ConfigModule,
    forwardRef(() => AppModule),
  ],
  controllers: [
    EmailingDevController
  ]
})
export class EmailingModule { }
