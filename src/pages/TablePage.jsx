import React, { useMemo, useRef, useState } from 'react';
import { Search, Heart } from 'lucide-react';
import '../index.css';
import { compareIdentity } from '../utils/familyData';

const TablePage = ({ treeData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [jumpIdentity, setJumpIdentity] = useState('');
    const [jumpError, setJumpError] = useState('');
    const [highlightedRowKey, setHighlightedRowKey] = useState('');
    const rowRefs = useRef(new Map());

    // Flatten the tree with depth-first traversal to maintain hierarchy order
    const flattenedData = useMemo(() => {
        if (!treeData) return [];
        const rows = [];
        const branchPalette = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48'];
        const accentByPrefix = new Map();

        const getBranchAccent = (branchId) => {
            const prefix = String(branchId || '').split('.').find(Boolean) || 'ROOT';
            if (!accentByPrefix.has(prefix)) {
                const nextColor = branchPalette[accentByPrefix.size % branchPalette.length];
                accentByPrefix.set(prefix, nextColor);
            }
            return accentByPrefix.get(prefix);
        };

        const traverse = (node, depth) => {
            const branchAccent = getBranchAccent(node.branch_id);

            // Create a search string for filtering
            const searchStr = `${node.name} ${node.branch_id || ''} ${node.spouse || ''}`.toLowerCase();

            rows.push({
                ...node,
                depth,
                branchAccent,
                searchStr
            });

            if (node.children) {
                // Sort children by normalized identity ordering.
                const sortedChildren = [...node.children].sort((a, b) => compareIdentity(a.branch_id, b.branch_id));
                sortedChildren.forEach(child => traverse(child, depth + 1));
            }
        };

        if (treeData.branch_id === 'ROOT' && Array.isArray(treeData.children)) {
            treeData.children
                .slice()
                .sort((a, b) => compareIdentity(a.branch_id, b.branch_id))
                .forEach((child) => {
                    traverse(child, 0);
                });
        } else {
            traverse(treeData, 0);
        }

        return rows.sort((a, b) => compareIdentity(a.branch_id, b.branch_id));
    }, [treeData]);

    const displayData = useMemo(() => {
        if (!searchTerm) return flattenedData;
        return flattenedData.filter(row => row.searchStr.includes(searchTerm.toLowerCase()));
    }, [flattenedData, searchTerm]);

    const handleJumpToIdentity = () => {
        const targetId = jumpIdentity.trim();
        if (!targetId) {
            setJumpError('Enter an identity number first.');
            return;
        }

        const targetRow = flattenedData.find((row) => String(row.branch_id || '').trim() === targetId);
        if (!targetRow) {
            setJumpError(`Identity ${targetId} not found.`);
            return;
        }

        setJumpError('');
        setSearchTerm('');

        const rowKey = targetRow._key || targetRow.branch_id;
        setHighlightedRowKey(rowKey);

        requestAnimationFrame(() => {
            const el = rowRefs.current.get(rowKey);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        setTimeout(() => setHighlightedRowKey(''), 1800);
    };

    if (!treeData) {
        return (
            <div className="page-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className="status-msg">Loading Registry...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="content-wrapper" style={{ maxWidth: '1400px', padding: '0', background: 'transparent', boxShadow: 'none' }}>

                {/* Header Section */}
                <div className="registry-header">
                    <div className="header-title">
                        <h2>Family Registry</h2>
                        <span className="badge-count">{flattenedData.length} Records</span>
                    </div>
                    <div className="search-bar">
                        <Search size={18} color="var(--text-sub)" />
                        <input
                            type="text"
                            placeholder="Search name, ID, or spouse..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="jump-bar">
                        <input
                            type="text"
                            placeholder="Jump to ID e.g. 03.05.04"
                            value={jumpIdentity}
                            onChange={(e) => setJumpIdentity(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleJumpToIdentity();
                                }
                            }}
                        />
                        <button type="button" className="jump-btn" onClick={handleJumpToIdentity}>
                            Go
                        </button>
                    </div>
                    {jumpError && <div className="jump-error">{jumpError}</div>}
                </div>

                {/* Table Container */}
                <div className="table-card">
                    <div className="table-responsive">
                        <table className="registry-table">
                            <thead>
                                <tr>
                                    <th className="th-id">Identity #</th>
                                    <th className="th-name">Name</th>
                                    <th className="th-spouse">Spouse</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.length > 0 ? displayData.map((row, idx) => {
                                    const rowKey = row._key || row.branch_id;
                                    return (
                                    <tr
                                        key={rowKey}
                                        ref={(el) => {
                                            if (!el) {
                                                rowRefs.current.delete(rowKey);
                                            } else {
                                                rowRefs.current.set(rowKey, el);
                                            }
                                        }}
                                        className={`registry-row ${idx % 2 === 0 ? 'even' : 'odd'} ${highlightedRowKey === rowKey ? 'registry-row-highlight' : ''}`}
                                        style={{ '--branch-accent': row.branchAccent || '#2563eb' }}
                                    >
                                        <td className="id-cell">
                                            <span className="branch-badge">{row.branch_id}</span>
                                        </td>
                                        <td>
                                            <div style={{ paddingLeft: `${Math.min(row.depth * 28, 200)}px` }} className="name-cell">
                                                {row.depth > 0 && <span className="tree-line">│</span>}
                                                <span className={`name-text ${row.depth === 0 ? 'root-name' : ''}`}>
                                                    {row.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="spouse-cell">
                                            {row.spouse ? (
                                                <div className="spouse-wrapper">
                                                    <Heart size={12} fill="var(--heart)" color="var(--heart)" />
                                                    <span>{row.spouse}</span>
                                                </div>
                                            ) : (
                                                <span className="empty-dash">-</span>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-sub)' }}>
                                            No members found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TablePage;
