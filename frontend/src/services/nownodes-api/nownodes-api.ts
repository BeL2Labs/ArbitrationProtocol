/**
 * Nownodes BTC Services
 * https://documenter.getpostman.com/view/13630829/TVmFkLwy#53f3a035-507d-47c1-81c2-f0dea88dacb9
 */

import axios from "axios";
import { AddressInfo, BTCBlock, BTCTransaction, BestBlockHashInfo, RPCNodeResult, UTXO } from "./model/types";

const mainnetNodeApi = 'https://nownodes-btc.bel2.org'; // 'https://btc.nownodes.io';
// const testnetNodeApi = 'https://btc-testnet.nownodes.io';
const mainnetExplorerApi = 'https://nownodes-btcbook.bel2.org'; // 'https://btcbook.nownodes.io';
const testnetExplorerApi = 'https:///nownodes-btcbook-testnet.bel2.org'

const apiGet = async <T>(url: string): Promise<T> => {
  const response = await axios({ method: "GET", url });
  return response?.data;
}

const apiPost = async <T>(url: string, data: any): Promise<T> => {
  const response = await axios<T>({
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    url,
    data
  });
  return response?.data;
}

/**
 * Gets info about a given address
 * EXPLORER api
 *
 * address/<address>[?page=<page>&pageSize=<size>&from=<block height>&to=<block height>&details=<basic|tokens|tokenBalances|txids|txs>&contract=<contract address>]
 */
export const getAddressInfo = async (address: string): Promise<AddressInfo> => {
  try {
    let requestUrl = `${rootExplorerApi()}/api/v2/address/${address}`;
    return await apiGet<AddressInfo>(requestUrl);
  }
  catch (err) {
    console.error('NowNodes: failed to get address info:', err);
    return null;
  }
}

/**
 * Returns block hash of the most recent block
 */
export const getBestBlockHash = (): Promise<BestBlockHashInfo> => {
  let requestUrl = `${rootExplorerApi()}/api/v2/getbestblockhash`;
  return apiGet<BestBlockHashInfo>(requestUrl);
}

const rootExplorerApi = () => {
  return /* isMainnetNetworkInUse() ? */ mainnetExplorerApi /* : testnetExplorerApi */;
}

/**
 * Returns information about a block, from its height or hash.
 *
 * @param heightOrHash block height or hash. If undefined, the latest block is used
 * @param withTxIds if true, API is called in a loop until all transactions of the block are retrieved. Transaction IDs are returned in a separate object
 */
export const getBlock = async (heightOrHash?: string, withTxIds = false): Promise<{ blockInfo: BTCBlock, txIds?: string[] }> => {
  try {
    // Get latest block hash
    if (!heightOrHash) {
      const bestBlock = await getBestBlockHash();
      heightOrHash = bestBlock?.backend.bestBlockHash;
    }

    let requestUrl = `${rootExplorerApi()}/api/v2/block/${heightOrHash}`;
    let blockInfo = await apiGet<BTCBlock>(requestUrl);

    if (!blockInfo || "error" in blockInfo)
      return { blockInfo: undefined, txIds: undefined }

    // Caller wants all transactions. So we continue to iterate all pages and build the txIds list.
    let txIds: string[] = undefined;
    if (withTxIds) {
      console.log("blockInfo", blockInfo)
      // Append transactions of the already fetched first page
      txIds = blockInfo?.txs.map(t => t.txid);

      for (let i = 2; i <= blockInfo?.totalPages || 0; i++) {
        console.log(`Fetching block's transaction page ${i}`);
        let nextPageInfo = await apiGet<BTCBlock>(`${requestUrl}?page=${i}`);
        txIds.push(...nextPageInfo.txs.map(t => t.txid));
      }
    }

    return { blockInfo, txIds };
  }
  catch (err) {
    console.error('NowNodes: failed to get address info:', err);
    return null;
  }
}

/**
 * Gets all transaction details for a given transaction ID.
 * EXPLORER api
 */
export const getTransactionDetails = async (txId: string): Promise<BTCTransaction> => {
  try {
    let requestUrl = `${rootExplorerApi()}/api/v2/tx/${txId}`;
    return await apiGet<BTCTransaction>(requestUrl);
  }
  catch (err) {
    console.error('NowNodes: failed to get transaction details:', err);
    return null;
  }
}

// EXPLORER api
export const getUTXOs = async (address: string): Promise<UTXO[]> => {
  try {
    let requestUrl = `${rootExplorerApi()}/api/v2/utxo/${address}?confirmed=true`;
    return await apiGet<UTXO[]>(requestUrl);
  }
  catch (err) {
    console.error('NowNodes: failed to get address UTXOs:', err);
    return null;
  }
}

export const publishBitcoinTransaction = async (signedTx: string) => {
  const publishResult = await apiPost<RPCNodeResult<string>>(`${mainnetNodeApi}`,
    {
      "jsonrpc": "1.0",
      "method": "sendrawtransaction",
      "params": [
        signedTx
      ]
    }
  );

  if (publishResult?.error)
    throw new Error(publishResult.error?.message);

  console.log('Publish result:', publishResult);

  return publishResult?.result;
}