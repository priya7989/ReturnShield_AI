import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Investigations from './pages/Investigations';
import InvestigationDetail from './pages/InvestigationDetail';
import NewInvestigation from './pages/NewInvestigation';

const HeaderWrapper = () => {
  const location = useLocation();

  const getTitles = (pathname) => {
    if (pathname === '/') {
      return { title: 'Dashboard', subtitle: 'Overview & Return Case Operations Center' };
    }
    if (pathname === '/investigations') {
      return { title: 'Investigations Directory', subtitle: 'Search and inspect all customer return claims' };
    }
    if (pathname.startsWith('/investigations/')) {
      return { title: 'Investigation Case File', subtitle: 'Detailed multi-entity audit and evidence breakdown' };
    }
    if (pathname === '/new-investigation') {
      return { title: 'New Return Claim', subtitle: 'Register customer request & upload evidence photos' };
    }
    return { title: 'ReturnShield AI', subtitle: 'Autonomous E-Commerce Returns Investigation System' };
  };

  const { title, subtitle } = getTitles(location.pathname);
  return <Navbar title={title} subtitle={subtitle} />;
};

export function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <HeaderWrapper />

          <main className="flex-1 p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/investigations" element={<Investigations />} />
              <Route path="/investigations/:id" element={<InvestigationDetail />} />
              <Route path="/new-investigation" element={<NewInvestigation />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
