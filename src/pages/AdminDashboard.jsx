
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save, UserPlus, Trash2, Edit2, LogOut, Settings,
    UploadCloud, Search, X, User, Users, Heart
} from 'lucide-react';
import './Admin.css';

export default function AdminDashboard({ treeData, setTreeData, cloudUrl }) {
    const [selectedNode, setSelectedNode] = useState(null);
    const [formData, setFormData] = useState({});
    const [statusMsg, setStatusMsg] = useState('');
    const [search, setSearch] = useState('');
    const [view, setView] = useState('table'); // 'table' or 'settings'
    const [isSyncing, setIsSyncing] = useState(false);

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

    // Filtered List for Search
    const filteredList = flattenedList.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.spouse && m.spouse.toLowerCase().includes(search.toLowerCase()))
    );

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // SAVE TO CLOUD
    const saveToCloud = async (newData) => {
        try {
            setIsSyncing(true);
            // Google Apps Script requires a POST with action=saveTree
            await fetch(cloudUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "saveTree", data: newData })
            });
            setStatusMsg("Cloud Updated!");
            setTimeout(() => setStatusMsg(''), 3000);
        } catch (err) {
            alert("Cloud Save Failed");
        } finally {
            setIsSyncing(false);
        }
    };

    // RECURSIVE UPDATE HELPER
    const updateNodeInTree = (root, targetId, updateFn) => {
        if (root.branch_id === targetId) return updateFn(root);
        if (root.children) {
            root.children = root.children.map(child => updateNodeInTree(child, targetId, updateFn)).filter(c => c !== null);
        }
        return root;
    };

    const handleSaveNode = () => {
        const newTree = updateNodeInTree({ ...treeData }, formData.branch_id, (node) => ({ ...node, ...formData }));
        setTreeData(newTree);
        saveToCloud(newTree);
        setSelectedNode(null);
    };

    const handleAddChild = (parent) => {
        const newChild = {
            branch_id: Date.now().toString(),
            name: "New Family Member",
            status: "Alive",
            children: []
        };
        const newTree = updateNodeInTree({ ...treeData }, parent.branch_id, (node) => {
            if (!node.children) node.children = [];
            node.children.push(newChild);
            return node;
        });
        setTreeData(newTree);
        saveToCloud(newTree);
        // Immediately edit the new child
        setSelectedNode(newChild);
        setFormData(newChild);
    };

    const handleDeleteNode = (memberId) => {
        if (window.confirm("Are you sure you want to delete this person? This will also remove all their children.")) {
            if (treeData.branch_id === memberId) return alert("Cannot delete Root!");

            const deleteRecursive = (node, targetId) => {
                if (node.branch_id === targetId) return null;
                if (node.children) node.children = node.children.map(c => deleteRecursive(c, targetId)).filter(c => c !== null);
                return node;
            };
            const resultTree = deleteRecursive({ ...treeData }, memberId);
            setTreeData(resultTree);
            saveToCloud(resultTree);
        }
    };

    if (!treeData) return <div className="loading">Connecting to Secure Cloud...</div>;

    return (
        <div className="admin-dashboard">
            {/* SIDEBAR */}
            <div className="admin-sidebar">
                <div className="admin-header"><h3>Family Admin</h3></div>
                <button className={`sidebar-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>
                    <Users size={18} /> All Members
                </button>
                <button className={`sidebar-btn ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
                    <Settings size={18} /> Cloud Sync
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
                        <Search size={18} color="#94a3b8" />
                        <input
                            className="search-input"
                            placeholder="Search by name or spouse..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        {isSyncing && <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 700 }}>Saving...</span>}
                        {statusMsg && <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>{statusMsg}</span>}
                    </div>
                </div>

                {view === 'table' && (
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Spouse</th>
                                    <th>DOB</th>
                                    <th>DOD</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.map(member => (
                                    <tr key={member.branch_id}>
                                        <td style={{ fontWeight: 600 }}>{member.name}</td>
                                        <td>
                                            <span className={`status-badge ${member.status === 'Deceased' ? 'deceased' : 'alive'}`}>
                                                {member.status || 'Alive'}
                                            </span>
                                        </td>
                                        <td>{member.spouse || '-'}</td>
                                        <td>{member.dob || '-'}</td>
                                        <td>{member.dod || '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="sidebar-btn active" style={{ padding: '6px' }} title="Edit" onClick={() => { setSelectedNode(member); setFormData(member); }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="sidebar-btn" style={{ padding: '6px', color: '#10b981' }} title="Add Child" onClick={() => handleAddChild(member)}>
                                                    <UserPlus size={16} />
                                                </button>
                                                <button className="sidebar-btn" style={{ padding: '6px', color: '#ef4444' }} title="Delete" onClick={() => handleDeleteNode(member.branch_id)}>
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
                        <div className="edit-modal" style={{ boxShadow: 'none', border: '1px solid #e2e8f0', width: '100%', maxWidth: '600px' }}>
                            <h2>Cloud Synchronization</h2>
                            <p style={{ color: '#64748b', marginBottom: '20px' }}>
                                Use this tool to upload your existing local data to the Google Cloud database.
                                This is only needed once during setup.
                            </p>
                            <button className="btn-primary" onClick={() => saveToCloud(treeData)}>
                                <UploadCloud size={18} /> Sync with Cloud Now
                            </button>
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
                                <label>Full Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Life Status</label>
                                <select name="status" value={formData.status || 'Alive'} onChange={handleChange}>
                                    <option value="Alive">Alive</option>
                                    <option value="Deceased">Deceased</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Spouse Name</label>
                                <input name="spouse" value={formData.spouse || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Date of Birth (DOB)</label>
                                <input name="dob" value={formData.dob || ''} onChange={handleChange} placeholder="e.g. 1950-01-01" />
                            </div>
                            {formData.status === 'Deceased' && (
                                <div className="form-group">
                                    <label>Date of Death (DOD)</label>
                                    <input name="dod" value={formData.dod || ''} onChange={handleChange} placeholder="e.g. 2020-05-15" />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Current Location</label>
                                <input name="location" value={formData.location || ''} onChange={handleChange} />
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
