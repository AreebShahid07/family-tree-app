import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save, UserPlus, Trash2, Edit2, LogOut, Settings,
    Search, Users, Download, RefreshCcw,
    ChevronRight, Home
} from 'lucide-react';
import './Admin.css';
import { compareIdentity, getNextChildIdentity } from '../utils/familyData';
import {
    verifyAdminSession,
    logoutAdmin,
    fetchFamilyTree,
    updateFamilyMember,
    createFamilyMember,
    deleteFamilyMember,
    loadFeedbackEntries,
    clearFeedbackEntries
} from '../services/dataService';

export default function AdminDashboard({ treeData, setTreeData }) {
    const [selectedNode, setSelectedNode] = useState(null);
    const [formData, setFormData] = useState({});
    const [statusMsg, setStatusMsg] = useState('');
    const [statusTone, setStatusTone] = useState('success');
    const [search, setSearch] = useState('');
    const [view, setView] = useState('table');
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewPath, setViewPath] = useState([]);
    const [feedbackEntries, setFeedbackEntries] = useState([]);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [feedbackSearch, setFeedbackSearch] = useState('');
    const [feedbackFromDate, setFeedbackFromDate] = useState('');
    const [feedbackToDate, setFeedbackToDate] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const checkSession = async () => {
            const ok = await verifyAdminSession();
            if (!ok && !cancelled) {
                navigate('/admin');
            }
        };

        checkSession();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const flattenedList = useMemo(() => {
        if (!treeData) return [];
        const members = [];
        const recurse = (node, parentName = 'Root') => {
            members.push({ ...node, parentName });
            if (node.children) {
                node.children.forEach((child) => recurse(child, node.name));
            }
        };
        recurse(treeData);
        return members;
    }, [treeData]);

    const displayList = useMemo(() => {
        if (!treeData) return [];

        if (search) {
            return flattenedList.filter((m) =>
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
            return [{ ...treeData, parentName: 'Source' }];
        }

        const currentKey = viewPath[viewPath.length - 1].key;

        const findNode = (root, key) => {
            if (root._key === key) return root;
            if (root.children) {
                for (const child of root.children) {
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

    const setTransientStatus = (tone, msg, timeout = 2800) => {
        setStatusTone(tone);
        setStatusMsg(msg);
        if (timeout > 0) {
            setTimeout(() => setStatusMsg(''), timeout);
        }
    };

    const refreshFeedbackEntries = async () => {
        try {
            setIsLoadingFeedback(true);
            const entries = await loadFeedbackEntries({
                search: feedbackSearch,
                fromDate: feedbackFromDate,
                toDate: feedbackToDate
            });
            setFeedbackEntries(entries);
        } catch (error) {
            setTransientStatus('error', error?.message || 'Feedback refresh failed', 4200);
        } finally {
            setIsLoadingFeedback(false);
        }
    };

    useEffect(() => {
        if (view === 'settings') {
            refreshFeedbackEntries();
        }
    }, [view, feedbackSearch, feedbackFromDate, feedbackToDate]);

    const handleExportFeedbackCsv = () => {
        if (!feedbackEntries.length) {
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
            ...feedbackEntries.map((entry) => [
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
        const confirmed = window.confirm('Delete all feedback entries from MongoDB?');
        if (!confirmed) return;

        try {
            setIsSyncing(true);
            await clearFeedbackEntries();
            await refreshFeedbackEntries();
            setTransientStatus('success', 'Feedback cleared!');
        } catch (error) {
            setTransientStatus('error', error?.message || 'Failed to clear feedback', 4200);
        } finally {
            setIsSyncing(false);
        }
    };

    const reloadTree = async () => {
        const freshTree = await fetchFamilyTree();
        setTreeData(freshTree);
    };

    const handleSaveNode = async () => {
        try {
            setIsSyncing(true);
            await updateFamilyMember({
                originalIdentityNum: selectedNode.branch_id,
                identityNum: formData.branch_id,
                name: formData.name,
                spouse: formData.spouse
            });
            await reloadTree();
            setSelectedNode(null);
            setTransientStatus('success', 'Member updated in MongoDB');
        } catch (error) {
            setTransientStatus('error', error?.message || 'Member update failed', 4200);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddChild = async (parent) => {
        const childId = getNextChildIdentity(parent.branch_id, parent.children || []);
        if (!childId) {
            alert('Please add children only under a valid identity number.');
            return;
        }

        try {
            setIsSyncing(true);
            await createFamilyMember({
                identityNum: childId,
                name: 'New Family Member',
                spouse: ''
            });
            await reloadTree();
            setTransientStatus('success', `Added child ${childId}`);
        } catch (error) {
            setTransientStatus('error', error?.message || 'Add child failed', 4200);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteNode = async (member) => {
        if (String(member?.branch_id || '').trim() === '00.00.00') {
            alert('Cannot delete the root anchor member.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this person?')) {
            return;
        }

        try {
            setIsSyncing(true);
            await deleteFamilyMember(member.branch_id);
            await reloadTree();
            setTransientStatus('success', `Deleted ${member.branch_id}`);
        } catch (error) {
            setTransientStatus('error', error?.message || 'Delete failed', 4200);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = async () => {
        await logoutAdmin();
        navigate('/');
    };

    if (!treeData) return <div className="loading">Loading Family Data...</div>;

    return (
        <div className="admin-dashboard">
            <div className="admin-sidebar">
                <div className="admin-header"><h3>Family Admin</h3></div>
                <button className={`sidebar-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>
                    <Users size={18} /> All Members
                </button>
                <button className={`sidebar-btn ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
                    <Settings size={18} /> Admin Tools
                </button>
                <div style={{ marginTop: 'auto' }}>
                    <button className="sidebar-btn logout" onClick={handleLogout}>
                        <LogOut size={18} /> Exit Admin
                    </button>
                </div>
            </div>

            <div className="admin-workspace">
                <div className="admin-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Search size={18} color="var(--text-sub)" />
                        <input
                            className="search-input"
                            placeholder="Search by name or spouse..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        {isSyncing && <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>Syncing...</span>}
                        {statusMsg && <span style={{ fontSize: '0.8rem', color: statusTone === 'error' ? 'var(--status-deceased)' : statusTone === 'info' ? 'var(--accent)' : 'var(--status-alive)', fontWeight: 700 }}>{statusMsg}</span>}
                    </div>
                </div>

                {view === 'table' && (
                    <div className="table-container">
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
                                {displayList.map((member) => (
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
                                                <button className="sidebar-btn" style={{ padding: '6px', color: 'var(--status-deceased)' }} title="Delete" onClick={() => handleDeleteNode(member)}>
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
                            <h2>MongoDB Sync Status</h2>
                            <p className="data-sync-subtitle">
                                This dashboard now reads and writes directly to MongoDB Atlas for every operation.
                            </p>
                            <div className="sync-actions">
                                <button className="btn-cancel" onClick={reloadTree} disabled={isSyncing || isLoadingFeedback}>
                                    <RefreshCcw size={16} /> Refresh Family Data
                                </button>
                            </div>

                            <div className="feedback-section">
                                <h3 className="feedback-title">Feedback Inbox</h3>
                                <div className="feedback-toolbar">
                                    <button className="btn-cancel" onClick={refreshFeedbackEntries} disabled={isLoadingFeedback || isSyncing}>
                                        <RefreshCcw size={16} /> {isLoadingFeedback ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                    <button className="btn-cancel" onClick={handleExportFeedbackCsv} disabled={!feedbackEntries.length}>
                                        <Download size={16} /> Export CSV
                                    </button>
                                    <button className="btn-cancel" onClick={handleClearFeedback} disabled={!feedbackEntries.length || isSyncing}>
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

                                {feedbackEntries.length === 0 ? (
                                    <p style={{ color: 'var(--text-sub)', margin: 0 }}>
                                        No feedback entries found for current filters.
                                    </p>
                                ) : (
                                    <div className="feedback-list">
                                        {feedbackEntries.map((entry, idx) => (
                                            <div
                                                key={`${entry.createdAt || 'entry'}-${idx}`}
                                                className={`feedback-item ${idx === feedbackEntries.length - 1 ? 'last' : ''}`}
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
                        </div>
                    </div>
                )}
            </div>

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
                            <button className="btn-primary" onClick={handleSaveNode} disabled={isSyncing}>
                                <Save size={18} /> Update Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
