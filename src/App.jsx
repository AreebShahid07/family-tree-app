
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TreePage from './pages/TreePage';
import HistoryPage from './pages/History';
import FeedbackPage from './pages/Feedback';
import TablePage from './pages/TablePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import localTreeData from './family_tree_data.json'; // Fallback
import './index.css';

// --- CONFIG ---
const CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbwA_w6IPjwzDcOoyzAJAcpytMrLCTpIFMY365x3p91euChONdGgrOfEGDK28Nan_JEh1A/exec";

// ScrollToTop Helper
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [theme, setTheme] = useState('theme-light');
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Apply Root Theme
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Fetch Tree Data from Cloud
  const fetchTreeData = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent browser caching
      const res = await fetch(`${CLOUD_API_URL}?t=${Date.now()}`);
      const data = await res.json();

      if (data && !data.error) {
        setTreeData(data);
      } else {
        // Use local fallback if cloud is empty
        setTreeData(localTreeData);
      }
    } catch (err) {
      console.warn("Cloud fetch failed, using local fallback", err);
      setTreeData(localTreeData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreeData();
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

  return (
    <Router>
      <ScrollToTop />
      <div className={`app-root ${theme}`}>
        <NavbarWrapper />

        <main className="main-content">
          <Routes>
            <Route
              path="/tree"
              element={<TreePage theme={theme} setTheme={setTheme} treeData={treeData} />}
            />
            <Route path="/registry" element={<TablePage treeData={treeData} />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/feedback" element={<FeedbackPage cloudUrl={CLOUD_API_URL} />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<AdminLogin cloudUrl={CLOUD_API_URL} />} />
            <Route
              path="/admin/dashboard"
              element={<AdminDashboard treeData={treeData} setTreeData={setTreeData} cloudUrl={CLOUD_API_URL} />}
            />
          </Routes>
        </main>
        <Analytics />
      </div>
    </Router>
  );
}

const NavbarWrapper = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <Navbar />;
};
