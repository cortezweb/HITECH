import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import ServiceRegistry from './pages/ServiceRegistry';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function AppContent() {
  const { page, setPage, setSubstate, currentUser, rolePermissions } = useApp();

  // Screen Access Guard
  React.useEffect(() => {
    if (currentUser) {
      const allowed = rolePermissions[currentUser.role] || [];
      if (allowed.length > 0 && !allowed.includes(page)) {
        setPage(allowed[0]);
      }
    }
  }, [page, currentUser, rolePermissions]);

  if (!currentUser) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'inventory':
        return <Inventory />;
      case 'service_registry':
        return <ServiceRegistry />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Top Application Bar */}
      <TopBar />

      {/* Main Application Container */}
      <main className="ml-[88px] pt-16 min-h-screen p-8 transition-all duration-300 print:ml-0 print:p-0 print:pt-0">
        <div className="max-w-[1440px] mx-auto print:max-w-none">
          {renderActivePage()}
        </div>
      </main>

      {/* Contextual FAB (Trigger service registration quick access) */}
      {page !== 'service_registry' && (
        <button 
          onClick={() => {
            setPage('service_registry');
            setSubstate('service_registry', 'seleccion');
          }}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-secondary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 cursor-pointer print:hidden"
          title="Nueva Orden de Servicio"
        >
          <span className="material-symbols-outlined text-[26px]">build_circle</span>
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
