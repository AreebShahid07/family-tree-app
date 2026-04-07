
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save, UserPlus, Trash2, Edit2, LogOut, Settings,
    UploadCloud, Search, Users, Download, RefreshCcw,
    ChevronRight, Home
} from 'lucide-react';
import './Admin.css';
import bundledFamilyCsvUrl from '../assets/FAMILY-LATEST.csv?url';
import { compareIdentity, getNextChildIdentity, parseFamilyCsvToTree } from '../utils/familyData';
import {
    runStorageSetupChecks,
    saveTreeData,
    loadFeedbackEntries,
    clearFeedbackEntries
} from '../services/dataService';

const rebuildPaceMs = Number.parseInt(import.meta.env.VITE_REBUILD_PACE_MS || '0', 10);

export default function AdminDashboard({ treeData, setTreeData }) {
    const [selectedNode, setSelectedNode] = useState(null);
    const [formData, setFormData] = useState({});
    const [statusMsg, setStatusMsg] = useState('');
    const [statusTone, setStatusTone] = useState('success');
    const [search, setSearch] = useState('');
    const [view, setView] = useState('table'); // 'table' or 'settings'
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewPath, setViewPath] = useState([]); // Array of { key, name }
    const [setupChecks, setSetupChecks] = useState([]);
    const [isCheckingSetup, setIsCheckingSetup] = useState(false);
    const [feedbackEntries, setFeedbackEntries] = useState([]);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [feedbackSearch, setFeedbackSearch] = useState('');
    const [feedbackFromDate, setFeedbackFromDate] = useState('');
    const [feedbackToDate, setFeedbackToDate] = useState('');
    const [showAdvancedTools, setShowAdvancedTools] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const navigate = useNavigate();

    // Protect Route
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) navigate('/admin');
    }, []);

    // UTILITY: Flatten the hierarchical tree for the table
    const flattenedList = useMemo(() => {
        if (!treeData) return [];
        const members = [];
        const recurse = (node, parentName = "Root") => {
            members.push({ ...node, parentName });
            if (node.children) {
                node.children.forEach(child => recurse(child, node.name));
            }
        };
        recurse(treeData);
        return members;
    }, [treeData]);

    // List for display based on navigation or search
    const displayList = useMemo(() => {
        if (!treeData) return [];

        if (search) {
            return flattenedList.filter(m =>
                m.name.toLowerCase().includes(search.toLowerCase()) ||
                (m.spouse && m.spouse.toLowerCase().includes(search.toLowerCase()))
            );
        }

        if (viewPath.length === 0) {
            if (treeData.branch_id === 'ROOT') {
                const rootChildren = [...(treeData.children || [])]
                    .sort((a, b) => compareIdentity(a.branch_id, b.branch_id))
                    .map((c) => ({ ...c, parentName: 'Family Root' }));

                const anchorMember = rootChildren.find((member) => member.branch_id === '00.00.00');
                if (anchorMember) return [anchorMember];

                return rootChildren.slice(0, 1);
            }
            return [{ ...treeData, parentName: "Source" }];
        }

        const currentKey = viewPath[viewPath.length - 1].key;

        const findNode = (root, key) => {
            if (root._key === key) return root;
            if (root.children) {
                for (let child of root.children) {
                    const found = findNode(child, key);
                    if (found) return found;
                }
            }
            return null;
        };

        const node = findNode(treeData, currentKey);
        return node && node.children
            ? [...node.children]
                .sort((a, b) => compareIdentity(a.branch_id, b.branch_id))
                .map((c) => ({ ...c, parentName: node.name }))
            : [];
    }, [treeData, search, flattenedList, viewPath]);

    const navigateTo = (member) => {
        setViewPath([...viewPath, { key: member._key, name: member.name }]);
        setSearch('');
    };

    const navigateBack = (index) => {
        if (index === -1) {
            setViewPath([]);
        } else {
            setViewPath(viewPath.slice(0, index + 1));
        }
        setSearch('');
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSetupCheck = async () => {
        try {
            setIsCheckingSetup(true);
            const results = await runStorageSetupChecks(treeData);
            setSetupChecks(results);
        } finally {
            setIsCheckingSetup(false);
        }
    };

    const refreshFeedbackEntries = async () => {
        try {
            setIsLoadingFeedback(true);
            const entries = await loadFeedbackEntries();
            setFeedbackEntries(entries);
        } finally {
            setIsLoadingFeedback(false);
        }
    };

    const handleExportFeedbackCsv = () => {
        if (!filteredFeedbackEntries.length) {
            alert('No feedback found to export.');
            return;
        }

        const escapeCsv = (value) => {
            const text = String(value ?? '');
            const escaped = text.replace(/"/g, '""');
            return `"${escaped}"`;
        };

        const rows = [
            ['Created At', 'Name', 'Rating', 'Message'],
            ...filteredFeedbackEntries.map((entry) => [
                entry.createdAt || '',
                entry.name || '',
                entry.rating || '',
                entry.message || ''
            ])
        ];

        const csvText = rows
            .map((row) => row.map(escapeCsv).join(','))
            .join('\n');

        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'family-feedback.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClearFeedback = async () => {
        const confirmed = window.confirm('Delete all saved feedback on this device?');
        if (!confirmed) return;

        await clearFeedbackEntries();
        setFeedbackEntries([]);
        setStatusMsg('Feedback cleared!');
        setTimeout(() => setStatusMsg(''), 2500);
    };

    const handleHardRebuild = async () => {
        try {
            setIsSyncing(true);
            setStatusTone('info');
            setStatusMsg('Restoring from CSV...');

            const res = await fetch(bundledFamilyCsvUrl);
            const csv = await res.text();
            const canonicalTree = parseFamilyCsvToTree(csv);

            if (rebuildPaceMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, rebuildPaceMs));
            }

            await saveTreeData(canonicalTree);
            setTreeData(canonicalTree);
            setStatusTone('success');
            setStatusMsg('Tree restored and central CSV synced!');
            setTimeout(() => setStatusMsg(''), 3500);
        } catch (error) {
            console.error('Restore failed:', error);
            setStatusTone('error');
            setStatusMsg(error?.message || 'Restore failed');
            alert('Restore failed. Please try again.');
            setTimeout(() => setStatusMsg(''), 4500);
        } finally {
            setIsSyncing(false);
        }
    };

    const saveToStorage = async (newData) => {
        try {
            setIsSyncing(true);
            await saveTreeData(newData);
            setHasUnsavedChanges(false);
            setStatusTone('success');
            setStatusMsg("Saved and central CSV synced!");
            setTimeout(() => setStatusMsg(''), 3000);
        } catch (err) {
            setStatusTone('error');
            setStatusMsg(err?.message || 'Save failed');
            setTimeout(() => setStatusMsg(''), 4500);
            alert("Save Failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const markUnsavedChanges = () => {
        setHasUnsavedChanges(true);
        setStatusTone('info');
        setStatusMsg('Unsaved changes. Go to Data Sync and click Save Now.');
    };

    // RECURSIVE UPDATE HELPER
    const updateNodeInTree = (root, targetKey, updateFn) => {
        if (root._key === targetKey) return updateFn(root);
        if (root.children) {
            root.children = root.children.map(child => updateNodeInTree(child, targetKey, updateFn)).filter(c => c !== null);
        }
        return root;
    };

    const handleSaveNode = () => {
        const newTree = updateNodeInTree({ ...treeData }, selectedNode._key, (node) => ({ ...node, ...formData }));
        setTreeData(newTree);
        markUnsavedChanges();
        setSelectedNode(null);
    };

    const handleAddChild = (parent) => {
        const childId = getNextChildIdentity(parent.branch_id, parent.children || []);
        if (!childId) {
            alert('Please add children only under a valid identity number.');
            return;
        }

        const newChild = {
            _key: `${childId}__${Date.now()}`,
            branch_id: childId,
            name: "New Family Member",
            spouse: '',
            children: []
        };
        const newTree = updateNodeInTree({ ...treeData }, parent._key, (node) => {
            if (!node.children) node.children = [];
            node.children.push(newChild);
            return node;
        });
        setTreeData(newTree);
        markUnsavedChanges();
        // Immediately edit the new child
        setSelectedNode(newChild);
        setFormData(newChild);
    };

    const handleDeleteNode = (memberKey) => {
        if (window.confirm("Are you sure you want to delete this person? This will also remove all their children.")) {
            if (treeData._key === memberKey) return alert("Cannot delete Root!");

            const deleteRecursive = (node, targetKey) => {
                if (node._key === targetKey) return null;
                if (node.children) node.children = node.children.map(c => deleteRecursive(c, targetKey)).filter(c => c !== null);
                return node;
            };
            const resultTree = deleteRecursive({ ...treeData }, memberKey);
            setTreeData(resultTree);
            markUnsavedChanges();
        }
    };

    const filteredFeedbackEntries = useMemo(() => {
        const term = feedbackSearch.trim().toLowerCase();
        const fromMs = feedbackFromDate ? new Date(`${feedbackFromDate}T00:00:00`).getTime() : null;
        const toMs = feedbackToDate ? new Date(`${feedbackToDate}T23:59:59`).getTime() : null;

        return feedbackEntries.filter((entry) => {
            const name = String(entry?.name || '').toLowerCase();
            const message = String(entry?.message || '').toLowerCase();
            const rating = String(entry?.rating || '').toLowerCase();

            const matchesText = !term || name.includes(term) || message.includes(term) || rating.includes(term);

            const createdAtMs = entry?.createdAt ? new Date(entry.createdAt).getTime() : null;
            const validDate = Number.isFinite(createdAtMs);
            const matchesFrom = fromMs === null || (validDate && createdAtMs >= fromMs);
            const matchesTo = toMs === null || (validDate && createdAtMs <= toMs);

            return matchesText && matchesFrom && matchesTo;
        });
    }, [feedbackEntries, feedbackSearch, feedbackFromDate, feedbackToDate]);

    useEffect(() => {
        if (view === 'settings') {
            refreshFeedbackEntries();
        }
    }, [view]);

    if (!treeData) return <div className="loading">Loading Family Data...</div>;

    return (
        <div className="admin-dashboard">
            {/* SIDEBAR */}
            <div className="admin-sidebar">
                <div className="admin-header"><h3>Family Admin</h3></div>
                <button className={`sidebar-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>
                    <Users size={18} /> All Members
                </button>
                <button className={`sidebar-btn ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
                    <Settings size={18} /> Data Sync
                </button>
                <div style={{ marginTop: 'auto' }}>
                    <button className="sidebar-btn logout" onClick={() => { localStorage.removeItem('admin_token'); navigate('/'); }}>
                        <LogOut size={18} /> Exit Admin
                    </button>
                </div>
            </div>

            {/* WORKSPACE */}
            <div className="admin-workspace">
                <div className="admin-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Search size={18} color="var(--text-sub)" />
                        <input
                            className="search-input"
                            placeholder="Search by name or spouse..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        {isSyncing && <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>Saving...</span>}
                        {statusMsg && <span style={{ fontSize: '0.8rem', color: statusTone === 'error' ? 'var(--status-deceased)' : statusTone === 'info' ? 'var(--accent)' : 'var(--status-alive)', fontWeight: 700 }}>{statusMsg}</span>}
                        {!isSyncing && !statusMsg && hasUnsavedChanges && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>
                                Unsaved changes. Save from Data Sync.
                            </span>
                        )}
                    </div>
                </div>

                {view === 'table' && (
                    <div className="table-container">
                        {/* Breadcrumbs */}
                        {!search && (
                            <div className="admin-breadcrumbs">
                                <span
                                    className={`breadcrumb-item ${viewPath.length === 0 ? 'active' : ''}`}
                                    onClick={() => navigateBack(-1)}
                                >
                                    <Home size={14} /> Root
                                </span>
                                {viewPath.map((path, idx) => (
                                    <React.Fragment key={path.key}>
                                        <ChevronRight size={14} className="breadcrumb-separator" />
                                        <span
                                            className={`breadcrumb-item ${idx === viewPath.length - 1 ? 'active' : ''}`}
                                            onClick={() => navigateBack(idx)}
                                        >
                                            {path.name}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Identity #</th>
                                    <th>Name</th>
                                    <th>Spouse</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayList.map(member => (
                                    <tr key={member._key || member.branch_id}>
                                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{member.branch_id}</td>
                                        <td style={{ fontWeight: 600 }}>{member.name}</td>
                                        <td>{member.spouse || '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="sidebar-btn active" style={{ padding: '6px' }} title="Edit" onClick={() => { setSelectedNode(member); setFormData(member); }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="sidebar-btn" style={{ padding: '6px', color: 'var(--accent)' }} title="Show Children" onClick={() => navigateTo(member)}>
                                                    <Users size={16} />
                                                </button>
                                                <button className="sidebar-btn" style={{ padding: '6px', color: 'var(--status-alive)' }} title="Add Child" onClick={() => handleAddChild(member)}>
                                                    <UserPlus size={16} />
                                                </button>
                                                <button className="sidebar-btn" style={{ padding: '6px', color: 'var(--status-deceased)' }} title="Delete" onClick={() => handleDeleteNode(member._key)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'settings' && (
                    <div className="table-container">
                        <div className="data-sync-panel">
                            <h2>Data Synchronization</h2>
                            <p className="data-sync-subtitle">
                                Save your latest tree changes on this device and restore from bundled CSV when needed.
                            </p>
                            <div className="sync-actions">
                                <button className="btn-primary" onClick={() => saveToStorage(treeData)} disabled={isSyncing || isCheckingSetup}>
                                    <UploadCloud size={18} /> Save Now
                                </button>
                                <button className="btn-cancel" onClick={() => setShowAdvancedTools((prev) => !prev)}>
                                    {showAdvancedTools ? 'Hide Advanced Tools' : 'Show Advanced Tools'}
                                </button>
                            </div>

                            {showAdvancedTools && (
                                <>
                                    <div className="advanced-actions">
                                        <button className="btn-cancel" onClick={handleSetupCheck} disabled={isCheckingSetup || isSyncing}>
                                            {isCheckingSetup ? 'Checking Storage...' : 'Run Storage Check'}
                                        </button>
                                        <button className="btn-cancel" onClick={handleHardRebuild} disabled={isSyncing || isCheckingSetup}>
                                            {isSyncing ? 'Restoring...' : 'Restore Data from CSV'}
                                        </button>
                                    </div>

                                    {setupChecks.length > 0 && (
                                        <div className="setup-checks">
                                            {setupChecks.map((item) => (
                                                <div key={item.key} className="setup-check-row">
                                                    <span className="setup-check-key">{item.key}</span>
                                                    <span className={`setup-check-msg ${item.ok ? 'ok' : 'error'}`}>
                                                        {item.ok ? 'OK' : 'Issue'}: {item.message}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="feedback-section">
                                        <h3 className="feedback-title">Feedback Inbox</h3>
                                        <div className="feedback-toolbar">
                                            <button className="btn-cancel" onClick={refreshFeedbackEntries} disabled={isLoadingFeedback || isSyncing}>
                                                <RefreshCcw size={16} /> {isLoadingFeedback ? 'Refreshing...' : 'Refresh'}
                                            </button>
                                            <button className="btn-cancel" onClick={handleExportFeedbackCsv} disabled={!filteredFeedbackEntries.length}>
                                                <Download size={16} /> Export CSV
                                            </button>
                                            <button className="btn-cancel" onClick={handleClearFeedback} disabled={!feedbackEntries.length}>
                                                <Trash2 size={16} /> Clear Feedback
                                            </button>
                                        </div>

                                        <div className="feedback-filters">
                                            <input
                                                className="search-input"
                                                placeholder="Search name, message, or rating"
                                                value={feedbackSearch}
                                                onChange={(e) => setFeedbackSearch(e.target.value)}
                                            />
                                            <input
                                                type="date"
                                                className="search-input"
                                                value={feedbackFromDate}
                                                onChange={(e) => setFeedbackFromDate(e.target.value)}
                                            />
                                            <input
                                                type="date"
                                                className="search-input"
                                                value={feedbackToDate}
                                                onChange={(e) => setFeedbackToDate(e.target.value)}
                                            />
                                        </div>

                                        {filteredFeedbackEntries.length === 0 ? (
                                            <p style={{ color: 'var(--text-sub)', margin: 0 }}>
                                                {feedbackEntries.length === 0
                                                    ? 'No feedback has been submitted yet.'
                                                    : 'No feedback matches the current filters.'}
                                            </p>
                                        ) : (
                                            <div className="feedback-list">
                                                {filteredFeedbackEntries.map((entry, idx) => (
                                                    <div
                                                        key={`${entry.createdAt || 'entry'}-${idx}`}
                                                        className={`feedback-item ${idx === filteredFeedbackEntries.length - 1 ? 'last' : ''}`}
                                                    >
                                                        <div className="feedback-item-head">
                                                            <strong>{entry.name || 'Anonymous'}</strong>
                                                            <span className="feedback-item-time">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown time'}</span>
                                                        </div>
                                                        <div className="feedback-item-rating">
                                                            Rating: {entry.rating || '-'}
                                                        </div>
                                                        <div className="feedback-item-message">{entry.message || ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            {selectedNode && (
                <div className="modal-overlay">
                    <div className="edit-modal">
                        <h2>Edit Member Details</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Identity Number</label>
                                <input name="branch_id" value={formData.branch_id || ''} onChange={handleChange} placeholder="e.g. 01.01.01" />
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Spouse Name</label>
                                <input name="spouse" value={formData.spouse || ''} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setSelectedNode(null)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveNode}>
                                <Save size={18} /> Update Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
