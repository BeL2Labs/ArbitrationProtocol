import { EnsureWalletNetwork } from '@/components/base/EnsureWalletNetwork/EnsureWalletNetwork';
import { Loading } from '@/components/base/Loading';
import { PageContainer } from '@/components/base/PageContainer';
import { PageTitle } from '@/components/base/PageTitle';
import { PageTitleRow } from '@/components/base/PageTitleRow';
import { Button } from '@/components/ui/button';
import { useOwnedArbitrator } from '@/services/arbitrators/hooks/useOwnedArbitrator';
import { Layers2Icon, StarIcon } from 'lucide-react';
import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArbitratorPreview } from './ArbitratorPreview';
import { EditOperatorDialog } from './dialogs/EditOperator';
import { EditStakingDialog } from './dialogs/EditStaking';

const ArbitratorDashboard: FC = () => {
  const { ownedArbitrator, isPending } = useOwnedArbitrator();
  const navigate = useNavigate();
  const [editOperatorIsOpen, setEditOperatorIsOpen] = useState(false);
  const [editStakingIsOpen, setEditStakingIsOpen] = useState(false);

  return (
    <PageContainer>
      <PageTitleRow>
        <PageTitle>My arbitrator</PageTitle>
        <div className='flex gap-4'>
          <EnsureWalletNetwork continuesTo=''>
            {
              ownedArbitrator && <>
                <Button onClick={() => setEditStakingIsOpen(true)} disabled={isPending}><Layers2Icon />Edit staking</Button>
              </>
            }
            {
              ownedArbitrator && <>
                <Button onClick={() => setEditOperatorIsOpen(true)} disabled={isPending}><StarIcon />Edit operator</Button>
              </>
            }
            {
              !isPending && !ownedArbitrator && <Button onClick={() => navigate("/register-arbitrator")}>Register arbitrator</Button>
            }
          </EnsureWalletNetwork>
        </div>
      </PageTitleRow>
      {isPending && <Loading />}
      {
        !isPending && <>
          {ownedArbitrator && <ArbitratorPreview arbitrator={ownedArbitrator} />}
          {!ownedArbitrator && <div>No arbitrator owned yet</div>}
        </>
      }

      {ownedArbitrator && <EditOperatorDialog arbitrator={ownedArbitrator} isOpen={editOperatorIsOpen} onHandleClose={() => setEditOperatorIsOpen(false)} />}
      {ownedArbitrator && <EditStakingDialog arbiter={ownedArbitrator} isOpen={editStakingIsOpen} onHandleClose={() => setEditStakingIsOpen(false)} />}
    </PageContainer>
  );
}


export default ArbitratorDashboard;