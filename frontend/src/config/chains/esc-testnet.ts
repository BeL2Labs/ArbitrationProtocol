import { ChainConfig } from "@/services/chains/chain-config";
import { escTestnetBtcToken, escTestnetELAToken, escTestnetUSDTToken } from "@/services/tokens/tokens";

const hasCustomLocalSubgraphEndpoint = import.meta.env.VITE_APP_LOCAL_SUBGRAPH_ENDPOINT!.length > 0;
const escTestnetSubgraph = hasCustomLocalSubgraphEndpoint ? import.meta.env.VITE_APP_LOCAL_SUBGRAPH_ENDPOINT! : "https://graph.bel2.org/subgraphs/name/bel2-loan-esc-testnet";

export const escTestnet: ChainConfig = {
  name: "Elastos Smart Chain Testnet",
  rpcs: ["https://api-testnet.elastos.net/esc"],
  explorers: ["https://esc-testnet.elastos.io"],
  chainId: 21n,
  networkMode: "testnet",
  subgraph: {
    endpoint: escTestnetSubgraph
  },
  nativeCurrency: escTestnetELAToken,
  contracts: {
    configManager: "0x941796c51443493d2F5C03D3c40d3ff0F0B0BD30",
    arbitratorManager: "0x54eE4fc8951A936b6AA02079B76c497c0471c52A",
    compensationManager: "0x7c31A7185660d5c40B1A02D60dbcCfd221d40787",
    dappRegistry: "0xC9B498e769e1A7670f747beBB3A3b5172DD122D1",
    transactionManager: "0xD206be45b53Fa5C2065049c7a70B1aa1755a9475",
    nftInfo: "0x3fB20197AD095724662bF0AD499F3994bfD222D3",
    bPoSNFT: "0x6C91352F89b169843D8B50E1A34B60a46e363841",
    zkpService: null,
    signatureValidation: null,
    multicall3: null
  },
  tokens: [
    escTestnetBtcToken,
    escTestnetUSDTToken
  ]
}