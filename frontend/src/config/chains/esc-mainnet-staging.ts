import { ChainConfig } from "@/services/chains/chain-config";
import { clone } from "lodash";
import { escMainnetProd } from "./esc-mainnet-prod";

export const escMainnetStaging: ChainConfig =
  clone<ChainConfig>(escMainnetProd);

const hasCustomLocalSubgraphEndpoint =
  import.meta.env.VITE_APP_LOCAL_SUBGRAPH_ENDPOINT!.length > 0;
const subgraphEndpoint = hasCustomLocalSubgraphEndpoint
  ? import.meta.env.VITE_APP_LOCAL_SUBGRAPH_ENDPOINT!
  : "https://graph.bel2.org/subgraphs/name/arbitrators-staging";

// Start from prod config, and update a few things
escMainnetStaging.subgraph = {
  endpoint: subgraphEndpoint,
};

escMainnetStaging.contracts = {
  arbitratorManager: "0xA12529eb2C18926c82d05F2bdeb75D69b1aB3D13",
  compensationManager: "0x0b084E632cfDFd305ec49e8879cF55E485F27B25",
  configManager: "0xFEE110977d0BD3efCafB9770C0473cCF25cB2939",
  dappRegistry: "0x083D5519ac00b1F5012403c472295BBD8A277242",
  transactionManager: "0x4407bFf58deC8Bc2Ba723E440B02780608282790",
  nftInfo: "0x0a218CC87C48BA26D60f438860710f6c0D4AA050",
  bPoSNFT: "0x8e286664c6B8811015F936592Dd654e94Af3F494",
  zkpService: "0x783239D25d6C722238538cA9657D7c4094bA1AFA",
  signatureValidation: "0x06A658E636A77944bF09BFE0B69fD70Fe15fEd98",
  multicall3: "0x174BCCBfe2523af4af7791B963F52EEb81d0E92f",
};
