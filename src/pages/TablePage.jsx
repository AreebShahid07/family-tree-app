import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../index.css';

const TablePage = ({ treeData }) => {
    // Flatten the tree with depth-first traversal to maintain hierarchy order
    const flattenedData = useMemo(() => {
        if (!treeData) return [];
        const rows = [];
        const traverse = (node, depth, parentColor) => {
            // Determine Color based on top-level branch (children of Root)
            let rowColor = parentColor;

            // If this is a direct child of the root (Depth 1), assign a new color
            if (depth === 1) {
                // Cycle through a few nice colors
                const colors = ['#eff6ff', '#f0fdf4', '#faf5ff', '#fff1f2', '#fff7ed'];
                const index = (rows.length) % colors.length; // Simple distribution
                rowColor = colors[index];
            }

            // If depth 0 (Root), use a special color
            if (depth === 0) rowColor = '#f8fafc'; // Default light grey

            rows.push({
                ...node,
                depth,
                rowColor
            });

            if (node.children) {
                node.children.forEach(child => traverse(child, depth + 1, rowColor));
            }
        };

        traverse(treeData, 0, null);
        return rows;
    }, [treeData]);

    if (!treeData) {
        return (
            <div className="page-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className="status-msg">Loading Family Records...</div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ overflow: 'auto' }}>
            <div className="content-wrapper" style={{ maxWidth: '1200px', padding: '0' }}>
                <div className="page-header" style={{ padding: '24px 32px', margin: 0 }}>
                    <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Family Registry</h2>
                    <span style={{ color: 'var(--text-sub)' }}>{flattenedData.length} Records</span>
                </div>

                <div className="table-responsive">
                    <table className="registry-table">
                        <thead>
                            <tr>
                                <th style={{ width: '150px' }}>Identity Num</th>
                                <th>Name</th>
                                <th>Spouse</th>
                                <th>Life Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flattenedData.map((row) => (
                                <tr key={row.branch_id} style={{ backgroundColor: row.rowColor }}>
                                    <td className="id-cell">
                                        <span className="branch-id">{row.branch_id}</span>
                                    </td>
                                    <td>
                                        <div style={{ paddingLeft: `${row.depth * 20}px` }} className="name-cell">
                                            {row.depth > 0 && <span className="tree-line">└─</span>}
                                            <span style={{ fontWeight: row.depth === 0 ? 800 : 500 }}>
                                                {row.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{row.spouse || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${row.status === 'Deceased' ? 'deceased' : 'alive'}`}>
                                            {row.status || 'Alive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TablePage;
