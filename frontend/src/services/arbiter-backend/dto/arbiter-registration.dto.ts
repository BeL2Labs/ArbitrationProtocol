import { EvmChallengePayload } from "@/services/evm/hooks/useSignTypedData";

export type ArbiterRegistrationDTO = {
  ownerAddress: string;
  email: string;
  evmChallengePayload: EvmChallengePayload;
  signature: string;
}