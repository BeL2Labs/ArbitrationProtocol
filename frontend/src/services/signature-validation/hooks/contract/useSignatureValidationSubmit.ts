import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { Interface } from 'ethers';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/interfaces/ISignatureValidationService.sol/ISignatureValidationService.json";

export const useSubmitSignatureValidation = () => {
  const activeChain = useActiveEVMChainConfig();
  const { writeContract, isPending, isSuccess, error } = useContractCall();

  const submitSignatureValidation = useCallback(async (msgHash: string, signType: 0 | 1, signature: string, pubKey: string): Promise<string> => {
    const { hash, receipt } = await writeContract({
      contractAddress: activeChain?.contracts.signatureValidation,
      abi,
      functionName: 'submit',
      args: [
        `0x${msgHash}`,
        signType,
        `0x${signature}`,
        `0x${pubKey}`
      ]
    });

    console.log("Submit signature validation result:", hash, receipt)

    // Look for ArbitrationReqStored event in logs
    const iface = new Interface(abi);
    const logs = receipt?.logs || [];
    let requestId: string = undefined;
    for (const log of logs) {
      const parsedLog = iface.parseLog(log);
      if (parsedLog?.name === "submietted") {
        console.log("useSubmitSignatureValidation parsedLog", parsedLog)
        requestId = parsedLog.args[0];
        break;
      }
    }

    return requestId;
  }, [activeChain, writeContract]);

  return {
    /**
     * @param signType 0 is ECDSA, 1 is Schnorr
     * @param signature if ECDSA: DER encoded signature
     */
    submitSignatureValidation,
    isPending, isSuccess, error
  };
};
