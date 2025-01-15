import { SnackbarProvider } from 'notistack';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import 'reflect-metadata';
import Layout from './components/layout/Layout';
import { ErrorHandlerProvider } from './contexts/ErrorHandlerContext';
import { WalletProvider } from './contexts/WalletContext/WalletContext';
import ArbiterDashboard from './pages/ArbiterDashboard/ArbiterDashboard';
import ArbiterList from './pages/ArbiterList/ArbiterList';
import CompensationList from './pages/CompensationList/CompensationList';
import DAppList from './pages/DAppList/DAppList';
import RegisterArbiter from './pages/RegisterArbiter/RegisterArbiter';
import RegisterDApp from './pages/RegisterDApp/RegisterDApp';
import TransactionList from './pages/TransactionList/TransactionList';

function App() {
  return (
    <SnackbarProvider
      maxSnack={1}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      <ErrorHandlerProvider>
        <WalletProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<ArbiterList />} />
                <Route path="/arbiters" element={<ArbiterList />} />
                <Route path="/dashboard" element={<ArbiterDashboard />} />
                <Route path="/transactions/:transactionId" element={<TransactionList />} />
                <Route path="/transactions" element={<TransactionList />} />
                <Route path="/compensations" element={<CompensationList />} />
                <Route path="/dapps" element={<DAppList />} />
                <Route path="/register-dapp" element={<RegisterDApp />} />
                <Route path="/register-arbiter" element={<RegisterArbiter />} />
              </Routes>
            </Layout>
          </Router>
        </WalletProvider>
      </ErrorHandlerProvider>
    </SnackbarProvider>
  );
}

export default App;
