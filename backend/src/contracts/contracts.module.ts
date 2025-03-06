import { Module } from '@nestjs/common';
import { ConfigManagerContractService } from './config-manager-contract.service';

@Module({
  providers: [ConfigManagerContractService],
  exports: [ConfigManagerContractService]
})
export class ContractsModule { }
