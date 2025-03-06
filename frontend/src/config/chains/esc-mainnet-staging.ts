import { ChainConfig } from '@/services/chains/chain-config';
import { clone } from 'lodash';
import { escMainnetProd } from './esc-mainnet-prod';

export const escMainnetStaging: ChainConfig = clone<ChainConfig>(escMainnetProd);

const hasCustomLocalSubgraphEndpoint = import.meta.env.VITE_APP_LOCAL_SUBGRAPH_ENDPOINT!.length > 0;
const subgraphEndpoint = hasCustomLocalSubgraphEndpoint ? import.meta.env.VITE_APP_LOCAL_SUBGRAPH_ENDPOINT! : "https://graph.bel2.org/subgraphs/name/arbitrators-staging";

// Start from prod config, and update a few things
escMainnetStaging.subgraph = {
  endpoint: subgraphEndpoint
};

escMainnetStaging.contracts = {
  arbitratorManager: "0x9963b5214434776D043A4e98Bc7f33321F6aaCfc",
  compensationManager: "0x9F8B0E8aEa662994C4Fd36De07398339559cd57E",
  configManager: "0x4421c63241A262C423277FFA82C376953072d25f",
  dappRegistry: "0x538f5e27299384c0FEF434d3359d948277E13C85",
  transactionManager: "0x1f872A1fBc02A38B087DE6af2176ab0BC63a53d0",
  nftInfo: "0x0a218CC87C48BA26D60f438860710f6c0D4AA050",
  bPoSNFT: "0x8e286664c6B8811015F936592Dd654e94Af3F494",
  zkpService: "0x783239D25d6C722238538cA9657D7c4094bA1AFA",
  signatureValidation: "0x2dfBa540CC298147FA190a594E501D3ef3EDE571",
  multicall3: "0x174BCCBfe2523af4af7791B963F52EEb81d0E92f"
};
