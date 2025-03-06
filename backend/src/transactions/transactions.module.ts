import { Module } from '@nestjs/common';
import { SubgraphModule } from 'src/subgraph/subgraph.module';
import { TransactionsService } from './transactions.service';

@Module({
  providers: [
    TransactionsService
  ],
  imports: [
    SubgraphModule
  ],
  exports: [
    TransactionsService
  ]
})
export class TransactionsModule { }
