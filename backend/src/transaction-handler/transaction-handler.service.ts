import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getAddress } from 'ethers';
import moment from 'moment';
import { ConfigManagerContractService } from 'src/contracts/config-manager-contract.service';
import { EmailTemplateType } from 'src/emailing/email-template-type';
import { EmailingService } from 'src/emailing/emailing.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Transaction } from 'src/transactions/model/transaction';
import { TransactionsService } from 'src/transactions/transactions.service';

const FetchTransactionsIntervalSec = 30;

@Injectable()
export class TransactionHandlerService implements OnModuleInit {
  private logger = new Logger("TransactionHandler");

  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private emailing: EmailingService,
    private configManager: ConfigManagerContractService
  ) { }

  onModuleInit() {
    void this.launchBackgroundProcessing();
  }

  private launchBackgroundProcessing() {
    this.logger.log("Launch background processing");

    void this.getAndProcessRecentTransactions();
  }

  private async getAndProcessRecentTransactions() {
    const { transactions } = await this.transactionsService.fetchTransactions(0, 100);
    this.logger.log(`Fetched ${transactions.length} recent transactions`);

    // Insert unknown transactions
    for (const tx of transactions) {
      await this.checkInsertTransaction(tx);
    }

    // Process emails to send
    await this.processEmailsToSend();

    setTimeout(() => {
      void this.getAndProcessRecentTransactions();
    }, FetchTransactionsIntervalSec * 1000);
  }

  private async checkInsertTransaction(transaction: Transaction) {
    // Skip transaction if it doesn't have an arbitration request
    if (!transaction.requestArbitrationTime)
      return;

    // Ensure checksum address format
    const arbiterAddress = getAddress(transaction.arbiter);

    // Find if we already have a matching arbitration request DB entry
    const arbitrationRequest = await this.prisma.arbitrationRequest.findFirst({
      where: {
        requestArbitrationTime: transaction.requestArbitrationTime.toDate()
      }
    });

    if (arbitrationRequest)
      return;

    // Retrieve the transaction arbiter. Arbiter must have registered an email address into this service first.
    const arbiter = await this.prisma.arbiter.findFirst({
      where: {
        ownerEvmAddress: arbiterAddress
      }
    });

    const arbitrationDeadline = moment(transaction.requestArbitrationTime).clone().add(Number(this.configManager.getSettings().arbitrationTimeout), "seconds").toDate();

    this.logger.log(`Transaction ${transaction.txId} (that has an arbitration request) not yet in DB, saving`);
    await this.prisma.arbitrationRequest.create({
      data: {
        transactionId: transaction.txId,
        requestArbitrationTime: transaction.requestArbitrationTime.toDate(),
        deadline: transaction.deadline.toDate(),
        arbitrationDeadline,
        ...(arbiter && { arbiterId: arbiter.id }),
      }
    });
  }

  private async processEmailsToSend() {
    // Get all arbiters that have an email address and have not been notified yet
    const pendingRequests = await this.prisma.arbitrationRequest.findMany({
      where: {
        arbiter: { isNot: null },
        arbiterOwnerNotifiedAt: null
      }
    });

    if (pendingRequests.length > 0) {
      this.logger.log(`There are ${pendingRequests.length} pending requests to process.`);
      for (const request of pendingRequests) {
        // Fetch the transaction again, in case it was updated while handling another transaction
        const refreshedRequest = await this.prisma.arbitrationRequest.findFirst({
          where: {
            id: request.id,
            arbiterOwnerNotifiedAt: null
          },
          include: { arbiter: true }
        });

        if (!refreshedRequest)
          continue;

        // Send email to arbiter owner
        const arbiter = refreshedRequest.arbiter!;
        if (arbiter.email) {
          this.logger.log(`Sending arbitration request email to arbiter owner ${arbiter.ownerEvmAddress} / ${arbiter.email} for arbiter id ${arbiter.id}`);

          // Send email
          const emailSent = await this.emailing.sendEmail(
            EmailTemplateType.ARBITRATION_REQUEST,
            undefined, // Automatic sender
            arbiter.email,
            "New arbitration request",
            {
              arbiterDashboardUrl: "https://arbiter.bel2.org/dashboard",
              arbiter: refreshedRequest.arbiter?.ownerEvmAddress,
              deadline: moment(refreshedRequest.arbitrationDeadline).format("YYYY-MM-DD HH:mm")
            }
          );

          if (emailSent) {
            this.logger.log('Email sent successfully. Marking all pending arbiter arbitration requests as processed.');

            // Mark all pending requests of this arbiter as notified so we dont send many emails for
            // all of them, one is enough.
            await this.prisma.arbitrationRequest.updateMany({
              where: {
                arbiterId: arbiter.id,
                arbiterOwnerNotifiedAt: null
              },
              data: {
                arbiterOwnerNotifiedAt: new Date()
              }
            });
          }
        }
      }
    }
  }
}