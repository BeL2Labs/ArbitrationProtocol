import { ChainConfig } from "@/services/chains/chain-config";
import { escBtcToken, escELAToken, escUSDCToken, escUSDTToken } from "@/services/tokens/tokens";

const hasCustomLocalSubgraphEndpoint = import.meta.env.VITE_APP_LOCAL_SUBGRAPH_ENDPOINT!.length > 0;
const subgraphEndpoint = hasCustomLocalSubgraphEndpoint ? import.meta.env.VITE_APP_LOCAL_SUBGRAPH_ENDPOINT! : "https://graph.bel2.org/subgraphs/name/arbitrators-prod";

export const escMainnetProd: ChainConfig = {
  name: "Elastos Smart Chain",
  rpcs: ["https://api2.elastos.net/esc"],
  explorers: ["https://esc.elastos.io"],
  chainId: 20n,
  networkMode: "mainnet",
  subgraph: {
    endpoint: subgraphEndpoint
  },
  nativeCurrency: escELAToken,
  contracts: {
    arbitratorManager: "0x935729143Ba2a19eBd7dA4a5bC8502d1e247aC8A",
    compensationManager: "0xB9c32892b38c64698673Ab69e445ee6C4e8A5267",
    configManager: "0x6Ae8A5C3290AD85D87ba6E7fC3938c0A45Bc622A",
    dappRegistry: "0x4Ad5DA5e8030cc29D931D756D2e88CD61E58a614",
    transactionManager: "0xa5EEFBcc8b4a1fb55dd7F8d5422B688557641a56",
    nftInfo: "0x0a218CC87C48BA26D60f438860710f6c0D4AA050",
    bPoSNFT: "0x8e286664c6B8811015F936592Dd654e94Af3F494",
    zkpService: "0x8B1755c8cEA289025f8f0669028095c4F81021f7",
    signatureValidation: null,
    multicall3: "0x174BCCBfe2523af4af7791B963F52EEb81d0E92f"
  },
  tokens: [
    escBtcToken,
    escUSDTToken,
    escUSDCToken
  ],
  isDefault: true
}
