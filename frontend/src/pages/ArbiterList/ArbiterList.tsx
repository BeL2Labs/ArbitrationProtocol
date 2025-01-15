import { Loading } from '@/components/base/Loading';
import { PageContainer } from '@/components/base/PageContainer';
import { PageTitle } from '@/components/base/PageTitle';
import { PageTitleRow } from '@/components/base/PageTitleRow';
import { SearchInput } from '@/components/base/SearchInput';
import { Button } from '@/components/ui/button';
import { useArbiters } from '@/services/arbiters/hooks/useArbiters';
import { useOwnedArbiter } from '@/services/arbiters/hooks/useOwnedArbiter';
import { useScreenSize } from '@/services/ui/hooks/useScreenSize';
import {
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { RefreshCwIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridView } from './GridView';
import { ListView } from './ListView';

type ViewMode = 'grid' | 'list';

export type SortConfig = {
  key: 'stake' | 'address' | 'currentFeeRate';
  direction: 'asc' | 'desc';
};

export default function ArbiterList() {
  const { arbiters: rawArbiters, fetchArbiters: refreshArbiters } = useArbiters();
  const { ownedArbiter } = useOwnedArbiter();
  const [viewMode, setViewMode] = useState<ViewMode>(localStorage.getItem('arbiterListMode') as ViewMode || 'grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'stake', direction: 'desc' });
  const navigate = useNavigate();
  const { isSmallDevice } = useScreenSize();
  const [showOperatorInfo, setShowOperatorInfo] = useState(false);

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('arbiterListMode', mode);
  }, []);

  const arbiters = useMemo(() => {
    const filtered = rawArbiters?.filter(arb => arb.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const directionFactor = sortConfig.direction === 'asc' ? 1 : -1;
    switch (sortConfig.key) {
      case "address":
        return filtered?.sort((a, b) => a.address.localeCompare(b.address) * directionFactor);
      case "stake":
        return filtered?.sort((a, b) => Number(a.totalValue.minus(b.totalValue)) * directionFactor);
      case "currentFeeRate":
        return filtered?.sort((a, b) => Number(a.currentFeeRate - b.currentFeeRate) * directionFactor);
      default:
        throw new Error(`Unknown sort key: ${sortConfig.key}`);
    }
  }, [rawArbiters, searchTerm, sortConfig]);

  const loading = useMemo(() => !rawArbiters, [rawArbiters]);

  // Refresh list when page loads
  useEffect(() => {
    void refreshArbiters();
  }, [refreshArbiters]);

  return (
    <PageContainer>
      <PageTitleRow>
        <PageTitle>Arbiters</PageTitle>
        <div className="flex space-x-4 w-full sm:w-auto items-center">
          <Button variant="outline" size="icon" onClick={refreshArbiters} className='shrink-0'>
            <RefreshCwIcon />
          </Button>
          <SearchInput placeholder="Search arbiters..."
            value={searchTerm}
            onChange={(newValue) => setSearchTerm(newValue)} />
          <div className="flex rounded-lg shadow-sm">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600'} rounded-l-lg border`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600'} rounded-r-lg border-t border-r border-b`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
          <Button disabled={!!ownedArbiter} onClick={() => navigate("/register-arbiter")}>
            {isSmallDevice ? 'Register' : 'Register arbiter'}
          </Button>
        </div>
      </PageTitleRow>

      {loading && <Loading />}
      {!loading && <>
        {viewMode === 'list' && <ListView arbiters={arbiters} sortConfig={sortConfig} handleSort={handleSort} />}
        {viewMode === 'grid' && <GridView arbiters={arbiters} showOperatorInfo={showOperatorInfo} onOperatorVisibilityChange={setShowOperatorInfo} />}
      </>}
    </PageContainer>
  );
}
