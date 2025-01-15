import { StatusLabelColor } from '@/components/base/StatusLabel';
import { ChainConfig } from '@/services/chains/chain-config';
import { dtoToClass } from "../class-transformer/class-transformer-utils";
import { ArbiterInfo as ArbiterInfoDTO } from '../subgraph/dto/arbiter-info';
import { SubgraphGQLResponse } from '../subgraph/gql-response';
import { ArbiterInfo } from './model/arbiter-info';

export const ArbiterMaxStakeValue = 50; // Maximum number of native coin value allowed for staking. Used during initial phase while testing things.

type FetchArbitersResponse = SubgraphGQLResponse<{
  arbiterInfos: ArbiterInfoDTO[];
}>;

export type FetchArbitersQueryParams = {
  creatorEvmAddress?: string;
  operatorEvmAddress?: string
}

/**
 * Fetch all arbiters from the subsgraph.
 */
export const fetchArbiters = async (chain: ChainConfig, start = 0, limit = 100, queryParams: FetchArbitersQueryParams = {}): Promise<{ arbiters: ArbiterInfo[], total: number }> => {
  let whereQuery = "";

  // Got this arbiter once for unknown reason (contract tests?) so... filter out.
  whereQuery += ` address_not: "0x0000000000000000000000000000000000000000"`;

  if (queryParams.creatorEvmAddress)
    whereQuery += ` address: "${queryParams.creatorEvmAddress.toLowerCase()}"`;
  if (queryParams.operatorEvmAddress)
    whereQuery += ` operatorEvmAddress: "${queryParams.operatorEvmAddress.toLowerCase()}"`;

  let whereClause: string = !whereQuery ? "" : `where: { ${whereQuery} }`;

  try {
    const resultsPerPage = 1000;
    let startAt = 0;
    let pageArbiters: ArbiterInfoDTO[] = [];
    let total = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const query = `query FetchArbiters {
        arbiterInfos (
          skip: ${startAt}
          first:${resultsPerPage}
          orderBy: createdAt,
          orderDirection: desc
          ${whereClause}
        ) { 
          id 
          createdAt 
          paused 
          address 
          ethAmount 
          nftValue
          deadLine 
          currentFeeRate 
          pendingFeeRate 
          activeTransactionId 
          operatorEvmAddress 
          operatorBtcAddress 
          operatorBtcPubKey
          revenueEvmAddress 
          revenueBtcAddress 
          revenueBtcPubKey
          isActive
          lastSubmittedWorkTime
        }
      }`;

      const response = await fetch(chain.subgraph.endpoint, {
        method: 'POST',
        body: JSON.stringify({ query: query }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const gqlResponse: FetchArbitersResponse = await response.json();

      if (gqlResponse.errors?.length > 0) {
        for (const error of gqlResponse.errors)
          console.error("Subgraph error:", new Error(error?.message));
      }

      const data = gqlResponse?.data;
      pageArbiters.push(...(data?.arbiterInfos || []));
      total += pageArbiters?.length || 0;

      if (pageArbiters.length < resultsPerPage) {
        // No more page to fetch
        break;
      }

      startAt += resultsPerPage;
    }

    const arbiterInfos = pageArbiters.slice(start, start + limit);

    return {
      arbiters: arbiterInfos.map(a => dtoToClass(a, ArbiterInfo)),
      total
    };
  } catch (error) {
    console.error("Error fetching arbiters:", error);
    return undefined;
  }
}

export const arbiterStatusLabelTitle = (arbiter: ArbiterInfo): string => {
  if (!arbiter.getIsActive())
    return "Busy";
  else
    return "Available";
}

export const arbiterStatusLabelColor = (arbiter: ArbiterInfo): StatusLabelColor => {
  if (!arbiter.getIsActive())
    return "yellow";
  else
    return "green";
}
