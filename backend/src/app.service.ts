import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(private config: ConfigService) { }

  public publicUrl(path: string): string {
    return `${this.config.get("SERVER_URL")}/${path}`;
  }
}
