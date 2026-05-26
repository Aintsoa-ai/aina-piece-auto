import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Pieces } from './pages/Pieces';
import { Stock } from './pages/Stock';
import { Sales } from './pages/Sales';
import { Purchases } from './pages/Purchases';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { ImportExcel } from './pages/ImportExcel';
import { Caisse } from './pages/Caisse';
import { Depenses } from './pages/Depenses';
import { Fournisseurs } from './pages/Fournisseurs';
import { Boutiques } from './pages/Boutiques';
import { Clients } from './pages/Clients';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Initialisation de AINA PIÈCE AUTO...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Render active page based on sidebar tab selection
  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pieces':
        return <Pieces />;
      case 'stock':
        return <Stock />;
      case 'sales':
        return <Sales />;
      case 'purchases':
        return <Purchases />;
      case 'caisse':
        return <Caisse />;
      case 'depenses':
        return <Depenses />;
      case 'fournisseurs':
        return <Fournisseurs />;
      case 'clients':
        return <Clients />;
      case 'boutiques':
        return <Boutiques />;
      case 'excel':
        return <ImportExcel />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderActivePage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-main)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(0, 242, 254, 0.1)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default App;
