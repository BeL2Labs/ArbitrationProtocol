import { Injectable } from '@nestjs/common';
import { SubgraphGQLResponse } from 'src/subgraph/dto/gql-response';
import { SubgraphService } from 'src/subgraph/subgraph.service';
import { dtoToClass } from 'src/utils/class-transformer';
import { Transaction as TransactionDTO } from '../subgraph/dto/transaction';
import { Transaction } from './model/transaction';

type FetchTransactionsResponse = SubgraphGQLResponse<{
  transactions: TransactionDTO[];
}>;

export type FetchTransactionsQueryParams = {
  arbiter?: string;
  search?: string;
}

@Injectable()
export class TransactionsService {
  constructor(private subgraph: SubgraphService) { }

  /**
   * Fetch all transactions from the subgraph.
   */
  public async fetchTransactions(start: number, limit: number, queryParams: FetchTransactionsQueryParams = {}): Promise<{ transactions: Transaction[], total: number }> {
    let whereQuery = "and: [";

    if (queryParams.search) {
      whereQuery += ` { or: [ \
          {txId_contains_nocase: "${queryParams.search.toLowerCase()}"} \
          {dapp_contains_nocase: "${queryParams.search.toLowerCase()}"} \
          {arbiter_contains_nocase: "${queryParams.search.toLowerCase()}"} \
      ]}`;
    }

    if (queryParams.arbiter)
      whereQuery += ` {arbiter: "${queryParams.arbiter.toLowerCase()}"} `;

    whereQuery += "]";

    const whereClause: string = !whereQuery ? "" : `where: { ${whereQuery} }`;

    try {
      const resultsPerPage = 1000;
      let startAt = 0;
      const pageTransactions: TransactionDTO[] = [];
      let total = 0;

      while (true) {
        const query = `query FetchTransactions {
          transactions (
            skip: ${startAt}
            first:${resultsPerPage}
            orderBy: createdAt,
            orderDirection: desc
            ${whereClause}
          ) { 
            id txId dapp arbiter startTime deadline requestArbitrationTime
            status depositedFee signature compensationReceiver timeoutCompensationReceiver
          }
        }`;

        const response = await fetch(this.subgraph.endpoint(), {
          method: 'POST',
          body: JSON.stringify({ query: query }),
          headers: new Headers({ 'Content-Type': 'application/json' })
        });

        const gqlResponse: FetchTransactionsResponse = await response.json();

        if (gqlResponse.errors?.length) {
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

      return {
        transactions: transactions.map(a => dtoToClass(a, Transaction)),
        total
      };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return {
        transactions: [],
        total: 0
      };
    }
  }

}
