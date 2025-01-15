import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { useOwnedArbiter } from '@/services/arbiters/hooks/useOwnedArbiter';
import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useConfigManager } from '@/services/config-manager/hooks/useConfigManager';
import { FC, useEffect } from 'react';
import { Footer } from './Footer/Footer';
import { Navbar } from './Navbar';

const Layout: FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeChain = useActiveEVMChainConfig();
  const { evmAccount } = useWalletContext();
  const { fetchOwnedArbiter } = useOwnedArbiter();
  const { fetchConfigManagerSettings } = useConfigManager();

  // Reset when chain or wallet changes
  useEffect(() => {
    void fetchOwnedArbiter();
  }, [activeChain, evmAccount, fetchOwnedArbiter]);

  useEffect(() => {
    void fetchConfigManagerSettings();
  }, [activeChain, evmAccount, fetchConfigManagerSettings]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Navbar />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-4">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
export default Layout;