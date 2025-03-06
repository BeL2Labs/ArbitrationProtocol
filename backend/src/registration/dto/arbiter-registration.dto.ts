export type ArbiterRegistrationDTO = {
  ownerAddress: string;
  email: string;
  evmChallengePayload: {
    message: string;
    date: string;
  };
  signature: string;
}