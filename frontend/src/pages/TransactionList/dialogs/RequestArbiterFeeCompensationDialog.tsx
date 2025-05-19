import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateCompensationRequest } from '@/services/compensations/hooks/contract/useCreateCompensationRequest';
import { Transaction } from '@/services/transactions/model/transaction';
import { FC } from 'react';

export const RequestArbiterFeeCompensationDialog: FC<{
  isOpen: boolean;
  transaction?: Transaction;
  onHandleClose: () => void;
}> = ({ transaction, isOpen, onHandleClose }) => {
  const { claimArbitratorFee, isPending: isSubmittingCompensationRequest } = useCreateCompensationRequest();

  const handleRequestCompensation = async () => {
    try {
      await claimArbitratorFee(transaction.id);
      onHandleClose();
    } catch (error) {
      console.error('Error requesting compensation:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onHandleClose}>
      <DialogContent aria-description='Close transaction'>
        <DialogHeader>
          <DialogTitle>Close transaction</DialogTitle>
        </DialogHeader>

        <div>This transaction has not been handled on time. You can close it.</div>

        <div className='flex justify-end space-x-4'>
          <Button variant='ghost' disabled={isSubmittingCompensationRequest} onClick={onHandleClose}>
            Cancel
          </Button>
          <Button onClick={handleRequestCompensation} disabled={isSubmittingCompensationRequest}>
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
