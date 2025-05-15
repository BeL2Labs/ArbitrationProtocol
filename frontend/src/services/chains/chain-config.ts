import { NetworkMode } from '@/services/network/network';
import { TokenOrNative } from '@/services/tokens/token-or-native';

export type ChainConfig = {
  name: string; // Displayable chain name
  rpcs: string[]; // List of chain RPC endpoints
  explorers: string[]; // List of block explorer API endpoints
  chainId: bigint; // eg: 21n for elastos testnet, "SN_MAIN" converted for starknet mainnet
  networkMode: NetworkMode; // This chain config only works for the given network mode
  subgraph: {
    endpoint: string;
  };
  nativeCurrency: TokenOrNative;
  contracts: {
    assetManager: string;
    arbitratorManager: string;
    compensationManager: string;
    configManager: string;
    dappRegistry: string;
    transactionManager: string;
    nftInfo: string;
    bPoSNFT: string;
    zkpService: string;
    signatureValidation: string;
    multicall3: string;
  };
  // List of supported tokens for deposits
  tokens: TokenOrNative[];
  isDefault?: boolean; // Use this chain as default is no connected wallet
};
