import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubgraphService {
  constructor(private config: ConfigService) { }

  public endpoint(): string {
    return this.config.get("SUBGRAPH_ENDPOINT") as string;
  }
}
