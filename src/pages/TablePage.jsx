import React, { useMemo, useState } from 'react';
import { Search, Heart, Activity } from 'lucide-react';
import '../index.css';

const TablePage = ({ treeData }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Flatten the tree with depth-first traversal to maintain hierarchy order
    const flattenedData = useMemo(() => {
        if (!treeData) return [];
        const rows = [];
        const traverse = (node, depth, parentColor) => {
            // Determine Color based on top-level branch (children of Root)
            let rowColor = parentColor;

            // If this is a direct child of the root (Depth 1), assign a new color
            if (depth === 1) {
                // Cycle through a few nice sleek colors
                const colors = ['var(--row-blue)', 'var(--row-green)', 'var(--row-purple)', 'var(--row-orange)'];
                const index = (rows.length) % colors.length;
                rowColor = colors[index];
            }

            // If depth 0 (Root), use a special color
            if (depth === 0) rowColor = 'var(--row-root)';

            // Create a search string for filtering
            const searchStr = `${node.name} ${node.branch_id || ''} ${node.spouse || ''}`.toLowerCase();

            rows.push({
                ...node,
                depth,
                rowColor,
                searchStr
            });

            if (node.children) {
                // Sort children by branch_id
                const sortedChildren = [...node.children].sort((a, b) =>
                    (a.branch_id || '').localeCompare(b.branch_id || '', undefined, { numeric: true })
                );
                sortedChildren.forEach(child => traverse(child, depth + 1, rowColor));
            }
        };

        traverse(treeData, 0, null);
        return rows;
    }, [treeData]);

    const displayData = useMemo(() => {
        if (!searchTerm) return flattenedData;
        return flattenedData.filter(row => row.searchStr.includes(searchTerm.toLowerCase()));
    }, [flattenedData, searchTerm]);

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
                                    <th className="th-status">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.length > 0 ? displayData.map((row) => (
                                    <tr key={row.branch_id} style={{ '--row-bg': row.rowColor }}>
                                        <td className="id-cell">
                                            <span className="branch-badge">{row.branch_id}</span>
                                        </td>
                                        <td>
                                            <div style={{ paddingLeft: `${Math.min(row.depth * 28, 200)}px` }} className="name-cell">
                                                {row.depth > 0 && <span className="tree-line">L</span>}
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
                                        <td>
                                            <div className={`status-pill ${row.status === 'Deceased' ? 'deceased' : 'alive'}`}>
                                                <Activity size={12} />
                                                <span>{row.status || 'Alive'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-sub)' }}>
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
