import { EvmChallengePayload } from "../evm/hooks/useSignTypedData";
import { ArbiterRegistrationResultDTO } from "./dto/arbiter-registration-result.dto";
import { ArbiterRegistrationDTO } from "./dto/arbiter-registration.dto";
import { ArbiterStatusDTO } from "./dto/arbiter-status.dto";
import { EmailVerificationDTO } from "./dto/email-verification.dto";

export const arbiterBackendEndpoint = import.meta.env.VITE_APP_ARBITER_BACKEND_ENDPOINT!;

const backendGet = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${arbiterBackendEndpoint}${path}`);
  if (!response.ok) {
    console.error(`Failed to get ${path}: ${response.statusText}`);
    return undefined;
  }
  return response.json() as T;
}

const backendPost = async <BodyType, ReturnType = unknown>(path: string, body: BodyType): Promise<ReturnType> => {
  console.log("body", body)
  const response = await fetch(`${arbiterBackendEndpoint}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorPayload = await response.json();
    console.error(`Failed to post ${path}: ${response.statusText}`, errorPayload);
    return undefined;
  }

  return response.json() as ReturnType;
}

export const fetchBackendArbiterStatus = async (arbiterAddress: string): Promise<ArbiterStatusDTO> => {
  const status = await backendGet<ArbiterStatusDTO>(`/registration/arbiter/status?owner=${arbiterAddress}`);
  return status;
}

export const upsertBackendArbiter = async (ownerAddress: string, email: string, evmChallengePayload: EvmChallengePayload, signature: string): Promise<ArbiterRegistrationResultDTO> => {
  const result = await backendPost<ArbiterRegistrationDTO, ArbiterRegistrationResultDTO>(
    `/registration/arbiter`,
    { ownerAddress, email, evmChallengePayload, signature }
  );
  return result;
}

export const sendEmailVerificationPIN = async (ownerAddress: string, pinCode: string): Promise<ArbiterStatusDTO> => {
  const result = await backendPost<EmailVerificationDTO, ArbiterStatusDTO>(
    `/registration/arbiter/email-verification`,
    { arbiterAddress: ownerAddress, pinCode }
  );
  return result;
}