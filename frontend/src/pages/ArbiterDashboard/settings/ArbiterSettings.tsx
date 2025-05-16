import { EnsureWalletNetwork } from '@/components/base/EnsureWalletNetwork/EnsureWalletNetwork';
import { Loading } from '@/components/base/Loading';
import { PageTitle } from '@/components/base/PageTitle';
import { PageTitleRow } from '@/components/base/PageTitleRow';
import { Button } from '@/components/ui/button';
import { useArbiterPause } from '@/services/arbiters/hooks/contract/useArbiterPause';
import { useArbiterResume } from '@/services/arbiters/hooks/contract/useArbiterResume';
import { useOwnedArbiter } from '@/services/arbiters/hooks/useOwnedArbiter';
import { RefreshCwIcon } from 'lucide-react';
import { FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArbiterPreview } from './ArbiterPreview';

export const ArbiterSettings: FC = () => {
  const { fetchOwnedArbiter, ownedArbiter, isPending: isFetchingArbiter } = useOwnedArbiter();
  const navigate = useNavigate();
  const { pauseArbiter, isPending: isPausing } = useArbiterPause();
  const { resumeArbiter, isPending: isResuming } = useArbiterResume();

  const handlePauseArbiter = useCallback(async () => {
    await pauseArbiter();
    void fetchOwnedArbiter();
  }, [fetchOwnedArbiter, pauseArbiter]);

  const handleResumeArbiter = useCallback(async () => {
    await resumeArbiter();
    void fetchOwnedArbiter();
  }, [fetchOwnedArbiter, resumeArbiter]);

  return (
    <>
      <PageTitleRow>
        <PageTitle>Arbiter settings</PageTitle>
        <div className='flex gap-4'>
          <Button variant='outline' size='icon' onClick={fetchOwnedArbiter}>
            <RefreshCwIcon />
          </Button>
          {!isFetchingArbiter && !ownedArbiter && (
            <EnsureWalletNetwork continuesTo='Register Arbiter'>
              <Button onClick={() => navigate('/register-arbiter')}>Register arbiter</Button>
            </EnsureWalletNetwork>
          )}
          {!isFetchingArbiter && ownedArbiter && !ownedArbiter.isPaused() && (
            <EnsureWalletNetwork continuesTo='Pause'>
              <Button onClick={handlePauseArbiter} disabled={isPausing || !ownedArbiter.getIsActive()}>
                Pause
              </Button>
            </EnsureWalletNetwork>
          )}
          {!isFetchingArbiter && ownedArbiter && ownedArbiter.isPaused() && (
            <EnsureWalletNetwork continuesTo='Resume'>
              <Button onClick={handleResumeArbiter} disabled={isResuming}>
                Resume
              </Button>
            </EnsureWalletNetwork>
          )}
        </div>
      </PageTitleRow>
      {isFetchingArbiter && <Loading />}
      {!isFetchingArbiter && (
        <>
          {ownedArbiter && <ArbiterPreview arbiter={ownedArbiter} />}
          {!ownedArbiter && <div>No arbiter owned yet</div>}
        </>
      )}
    </>
  );
};
