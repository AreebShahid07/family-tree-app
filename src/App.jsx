
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
import bundledFamilyCsvUrl from './assets/FAMILY-LATEST.csv?url';
import { parseFamilyCsvToTree } from './utils/familyData';
import { loadTreeData, saveTreeData, saveTreeDataLocalOnly } from './services/dataService';
import './index.css';

const AUTO_RESEED = String(import.meta.env.VITE_AUTO_RESEED || 'false').toLowerCase() === 'true';
const CENTRAL_CSV_URL = import.meta.env.VITE_CENTRAL_CSV_URL;
const CENTRAL_SOURCE_MODE = String(import.meta.env.VITE_CENTRAL_SOURCE_MODE || 'off').toLowerCase();
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;
const APPWRITE_CSV_FILE_ID = import.meta.env.VITE_APPWRITE_CSV_FILE_ID;

function getCentralCsvUrl() {
  if (CENTRAL_CSV_URL) return CENTRAL_CSV_URL;

  if (APPWRITE_ENDPOINT && APPWRITE_BUCKET_ID && APPWRITE_CSV_FILE_ID && APPWRITE_PROJECT_ID) {
    const endpoint = APPWRITE_ENDPOINT.replace(/\/$/, '');
    return `${endpoint}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${APPWRITE_CSV_FILE_ID}/view?project=${APPWRITE_PROJECT_ID}`;
  }

  return null;
}

async function loadTreeFromCentralCsv() {
  const url = getCentralCsvUrl();
  if (!url || CENTRAL_SOURCE_MODE !== 'appwrite') return null;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Central CSV fetch failed with ${res.status}`);
  }

  const csv = await res.text();
  if (!csv || !csv.trim()) return null;
  return parseFamilyCsvToTree(csv);
}

function countMembers(node) {
  if (!node) return 0;
  if (Array.isArray(node)) return node.reduce((sum, child) => sum + countMembers(child), 0);

  const self = node.branch_id && node.branch_id !== 'ROOT' ? 1 : 0;
  return self + (node.children || []).reduce((sum, child) => sum + countMembers(child), 0);
}

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

  // Apply Root Theme
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Load tree from local storage and fallback CSV.
  const fetchTreeData = async () => {
    let centralTree = null;
    let localTree = null;
    let csvTree = null;

    try {
      setLoading(true);

      try {
        centralTree = await loadTreeFromCentralCsv();
      } catch (centralErr) {
        console.warn('Central CSV load failed, evaluating local and bundled fallback', centralErr);
      }

      if (centralTree) {
        setTreeData(centralTree);
        try {
          await saveTreeDataLocalOnly(centralTree);
        } catch {
          // Local caching failure should not block centralized reads.
        }
        return;
      }

      try {
        localTree = await loadTreeData();
      } catch (localErr) {
        console.warn('Local tree load failed, evaluating CSV fallback', localErr);
      }

      const fallbackRes = await fetch(bundledFamilyCsvUrl);
      const fallbackCsv = await fallbackRes.text();
      csvTree = parseFamilyCsvToTree(fallbackCsv);

      const localCount = countMembers(localTree);
      const csvCount = countMembers(csvTree);

      if (localTree && localCount >= csvCount) {
        setTreeData(localTree);
      } else {
        setTreeData(csvTree);
        if (AUTO_RESEED) {
          try {
            await saveTreeData(csvTree);
          } catch (seedErr) {
            console.warn('Local tree reseed skipped:', seedErr);
          }
        }
      }
    } catch (err) {
      console.warn('Primary loading flow failed, using best available fallback', err);
      if (csvTree) {
        setTreeData(csvTree);
      } else if (centralTree) {
        setTreeData(centralTree);
      } else if (localTree) {
        setTreeData(localTree);
      } else {
        const fallbackRes = await fetch(bundledFamilyCsvUrl);
        const fallbackCsv = await fallbackRes.text();
        setTreeData(parseFamilyCsvToTree(fallbackCsv));
      }
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
