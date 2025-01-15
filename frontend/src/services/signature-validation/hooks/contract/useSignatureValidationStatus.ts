import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/interfaces/ISignatureValidationService.sol/ISignatureValidationService.json";
import { SignatureValidationResult } from '../../dto/signature-validation';

export const useSignatureValidationStatus = () => {
  const activeChain = useActiveEVMChainConfig();
  const { readContract } = useContractCall();

  /**
   * @param requestId ID of a request previously created by signatureValidation.submit().
   */
  const fetchSignatureValidationStatus = useCallback(async (requestId: string): Promise<SignatureValidationResult> => {
    if (!requestId)
      return undefined;

    const signatureValidation: SignatureValidationResult = await readContract({
      contractAddress: activeChain.contracts.signatureValidation,
      abi,
      functionName: 'getResult',
      args: [requestId]
    });

    return signatureValidation;
  }, [activeChain, readContract]);

  return { fetchSignatureValidationStatus };
};
