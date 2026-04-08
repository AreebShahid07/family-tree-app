
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import TreePage from './pages/TreePage';
import HistoryPage from './pages/History';
import FeedbackPage from './pages/Feedback';
import TablePage from './pages/TablePage';
import DocumentsPage from './pages/DocumentsPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ToastContainer from './components/ToastContainer';
import { fetchFamilyTree } from './services/dataService';
import './index.css';

// ScrollToTop Helper
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [theme, setTheme] = useState('theme-crimson');
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Apply Root Theme
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const refreshTreeData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const freshTree = await fetchFamilyTree();
      setTreeData(freshTree);
    } catch (err) {
      setTreeData(null);
      setLoadError(err?.message || 'Unable to fetch family data from MongoDB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTreeData();
  }, []);

  if (loading) {
    return (
      <div className="app-root theme-light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="status-msg">
          <span>Loading Family Records...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-root theme-light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="content-wrapper" style={{ maxWidth: '560px', textAlign: 'center' }}>
          <h2>Data Source Error</h2>
          <p>{loadError}</p>
          <button type="button" className="submit-btn" onClick={refreshTreeData}>
            Retry MongoDB Fetch
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <div className={`app-root ${theme}`}>
        <ToastContainer />
        <NavbarWrapper />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/tree"
              element={<TreePage theme={theme} setTheme={setTheme} treeData={treeData} />}
            />
            <Route path="/registry" element={<TablePage treeData={treeData} />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={<AdminDashboard treeData={treeData} setTreeData={setTreeData} />}
            />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

const NavbarWrapper = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <Navbar />;
};
