export type SignatureValidationResult = {
  verified: boolean;
  msghash: string;
  signature: string;
  pubkey: string;
}