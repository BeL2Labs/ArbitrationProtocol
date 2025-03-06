import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { ConfigManagerSettings } from './dto/config-manager-settings.dto';

/**
 * Service to access arbitration protocol config contract which holds things
 * like the arbitration timeout, the fees, etc.
 */
@Injectable()
export class ConfigManagerContractService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private configManagerSettings: ConfigManagerSettings;

  constructor(config: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(config.get("CHAIN_RPC_URL"));

    const contractAddress = config.getOrThrow("CHAIN_CONFIG_MANAGER_CONTRACT");
    const contractAbi = [
      "function getAllConfigs() external view returns (bytes32[] memory keys, uint256[] memory values)"
    ];

    // Create a contract instance
    this.contract = new ethers.Contract(contractAddress, contractAbi, this.provider);
  }

  async onModuleInit() {
    this.configManagerSettings = await this.getAllConfigs();
  }

  public getSettings(): ConfigManagerSettings {
    return this.configManagerSettings;
  }

  /**
   * Fetches all configuration settings from the smart contract.
   */
  private async getAllConfigs(): Promise<ConfigManagerSettings> {
    try {
      const result = await this.contract.getAllConfigs();

      return {
        minStake: BigInt(result[1][0]),
        maxStake: BigInt(result[1][1]),
        minStakeLockedTime: BigInt(result[1][2]),
        minTransactionDuration: BigInt(result[1][3]),
        maxTransactionDuration: BigInt(result[1][4]),
        transactionMinFeeRate: BigInt(result[1][5]),
        arbitrationTimeout: BigInt(result[1][6]),
        arbitrationFrozenPeriod: BigInt(result[1][7]),
        systemFeeRate: BigInt(result[1][8]),
        systemCompensationFeeRate: BigInt(result[1][9]),
        systemFeeCollector: BigInt(result[1][10]),
        arbitrationBtcFeeRate: BigInt(result[1][11])
      };
    } catch (error) {
      console.error("Error fetching config settings:", error);
      throw new Error("Failed to fetch config settings");
    }
  }
}
