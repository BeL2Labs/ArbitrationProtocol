import { useEVMContext } from '@/contexts/EVMContext/EVMContext';
import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { useCallback } from 'react';
import { Address } from 'viem';
import { useChainId, useSignTypedData as useWagmiSignTypedData } from 'wagmi';

export type EvmChallengePayload = {
  message: string;
  date: string;
}

export const useSignTypedData = () => {
  const { account } = useEVMContext();
  useWalletContext();
  const activeChainId = useChainId();
  const { signTypedDataAsync } = useWagmiSignTypedData();

  const requestTypedDataSignature = useCallback(async (): Promise<{ payload: EvmChallengePayload, signature: string }> => {
    try {
      const domain = {
        name: 'arbiter.bel2.org',
        version: '1',
        chainId: activeChainId
      };

      const types = {
        Message: [
          { name: 'message', type: 'string' },
          { name: 'date', type: 'string' },
        ],
      };

      const payload: EvmChallengePayload = {
        message: 'Please sign this message to verify your identity.',
        date: new Date().toISOString(),
      };

      // Request a signature from the user
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Message',
        message: payload,
        account: account as Address
      });

      return { payload, signature };
    } catch (error) {
      console.error('Error requesting typed data signature:', error);
      return undefined;
    }
  }, [account, activeChainId, signTypedDataAsync]);

  return { requestTypedDataSignature };
};
