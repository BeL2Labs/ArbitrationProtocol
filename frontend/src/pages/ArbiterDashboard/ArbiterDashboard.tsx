import { PageContainer } from '@/components/base/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FC } from 'react';
import { ArbiterSettings } from './settings/ArbiterSettings';
import { ArbiterTransactions } from './transactions/ArbiterTransactions';

const ArbiterDashboard: FC = () => {
  return (
    <PageContainer>
      <Tabs defaultValue="settings">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="transactions">Transaction history</TabsTrigger>
        </TabsList>

        {/* Settings tab content */}
        <TabsContent value="settings">
          <ArbiterSettings />
        </TabsContent>

        {/* Transactions tab content */}
        <TabsContent value="transactions">
          <ArbiterTransactions />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export default ArbiterDashboard;