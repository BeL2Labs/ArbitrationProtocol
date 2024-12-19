import { ChainConfig } from '@/services/chains/chain-config';
import { dtoToClass } from "../class-transformer/class-transformer-utils";
import { Transaction as TransactionDTO } from '../subgraph/dto/transaction';
import { SubgraphGQLResponse } from '../subgraph/gql-response';
import { Transaction } from './model/transaction';

type FetchTransactionsResponse = SubgraphGQLResponse<{
  transactions: TransactionDTO[];
}>;

/**
 * Fetch all transactions from the subsgraph.
 */
export const fetchTransactions = async (chain: ChainConfig, start: number, limit: number): Promise<{ transactions: Transaction[], total: number }> => {
  try {
    const resultsPerPage = 1000;
    let startAt = 0;
    let pageTransactions: TransactionDTO[] = [];
    let total = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const query = `query FetchTransactions {
        transactions (
          skip: ${startAt}
          first:${resultsPerPage}
          orderBy: createdAt,
          orderDirection: desc
        ) { 
          id txId dapp arbitrator startTime deadline btcTx btcTxHash 
          status depositedFee signature compensationReceiver timeoutCompensationReceiver
        }
      }`;

      const response = await fetch(chain.subgraph.endpoint, {
        method: 'POST',
        body: JSON.stringify({ query: query }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const gqlResponse: FetchTransactionsResponse = await response.json();

      if (gqlResponse.errors?.length > 0) {
        for (const error of gqlResponse.errors)
          console.error("Subgraph error:", new Error(error?.message));
      }

      const data = gqlResponse?.data;
      pageTransactions.push(...(data?.transactions || []));
      total += pageTransactions?.length || 0;

      if (pageTransactions.length < resultsPerPage) {
        // No more page to fetch
        break;
      }

      startAt += resultsPerPage;
    }

    const transactions = pageTransactions.slice(start, start + limit);

    console.log("Fetched transactions:", transactions);

    return {
      transactions: transactions.map(a => dtoToClass(a, Transaction)),
      total
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return undefined;
  }
}