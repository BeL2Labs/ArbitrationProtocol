import { Injectable } from '@nestjs/common';
import { verifyTypedData } from 'ethers';

const typedDataDomain: Record<string, any> = {
  name: "arbiter.bel2.org",
  version: "1",
  chainId: 20, // Elastos Smart Chain only for now
}

const typedDataTypes: Record<string, any> = {
  Message: [
    { name: "message", type: "string" },
    { name: "date", type: "string" }
  ]
}

@Injectable()
export class EvmService {
  public isSignatureValid(payload: Record<string, any>, signature: string, expectedAddress: string): boolean {
    const recoveredAddress = verifyTypedData(typedDataDomain, typedDataTypes, payload, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  }
}
