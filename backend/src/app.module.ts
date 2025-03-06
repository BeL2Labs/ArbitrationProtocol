import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailingModule } from './emailing/emailing.module';
import { EvmModule } from './evm/evm.module';
import { RegistrationModule } from './registration/registration.module';
import { SubgraphModule } from './subgraph/subgraph.module';
import { TransactionHandlerModule } from './transaction-handler/transaction-handler.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [
    EmailingModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule available globally
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'public')
    }),
    RegistrationModule,
    TransactionHandlerModule,
    SubgraphModule,
    TransactionsModule,
    EvmModule,
    ContractsModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService
  ],
  exports: [
    AppService
  ]
})
export class AppModule { }
