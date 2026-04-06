import React, { useMemo } from 'react';
import { Users, Activity, Layers, Baby, GitBranch } from 'lucide-react';
import '../index.css';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="stat-card" style={{ '--card-accent': color }}>
        <div className="stat-icon-wrapper">
            <Icon size={24} />
        </div>
        <div className="stat-content">
            <h3 className="stat-value">{value}</h3>
            <p className="stat-title">{title}</p>
            {subtext && <p className="stat-subtext">{subtext}</p>}
        </div>
    </div>
);

export default function StatisticsPage({ treeData }) {

    // --- ANALYTICS ENGINE ---
    const stats = useMemo(() => {
        if (!treeData) return null;

        let totalMembers = 0;
        let livingCount = 0;
        let deceasedCount = 0;
        let totalSpouses = 0;
        let maxDepth = 0;


        const branchSizes = []; // { name, count } for top-level children

        const recurse = (node, depth) => {
            totalMembers++;
            if (depth > maxDepth) maxDepth = depth;

            // Status
            if (node.status === 'Deceased') deceasedCount++;
            else livingCount++;

            // Spouse
            if (node.spouse) totalSpouses++;

            // Children Logic
            // (Removed most children calculation as requested)

            if (node.children) {
                node.children.forEach(child => recurse(child, depth + 1));
            }

            return 1 + (node.children ? node.children.reduce((acc, c) => acc + (c.descendantCount || 0), 0) : 0);
        };

        // Pre-calculate branch sizes for top-level nodes
        if (treeData.children) {
            treeData.children.forEach(child => {
                // Determine descendant count for this branch
                let count = 0;
                const countNodes = (n) => {
                    count++;
                    if (n.children) n.children.forEach(countNodes);
                };
                countNodes(child);
                branchSizes.push({ name: child.name, count });
            });
        }

        recurse(treeData, 1);

        // Sort branches by size
        branchSizes.sort((a, b) => b.count - a.count);

        return {
            totalMembers,
            livingCount,
            deceasedCount,
            totalSpouses,
            generations: maxDepth,

            branchSizes,
            livingPercent: Math.round((livingCount / totalMembers) * 100)
        };
    }, [treeData]);

    if (!treeData || !stats) {
        return <div className="page-container"><div className="status-msg">Analyzing Data...</div></div>;
    }

    return (
        <div className="page-container">
            <div className="content-wrapper" style={{ maxWidth: '1000px', background: 'transparent', boxShadow: 'none' }}>

                {/* Header */}
                <div className="page-header" style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Family Analytics</h2>
                    <p style={{ color: 'var(--text-sub)' }}>Real-time insights into the family demographics</p>
                </div>

                {/* Hero Stats */}
                <div className="stats-grid">
                    <StatCard
                        title="Total Members"
                        value={stats.totalMembers}
                        subtext="Across entire registry"
                        icon={Users}
                        color="var(--accent)"
                    />
                    <StatCard
                        title="Living Members"
                        value={stats.livingCount}
                        subtext={`${stats.livingPercent}% of family`}
                        icon={Activity}
                        color="#10b981"
                    />
                    <StatCard
                        title="Generations"
                        value={stats.generations}
                        subtext="Depth of lineage"
                        icon={Layers}
                        color="#8b5cf6"
                    />
                </div>

                <div className="stats-sections-grid">
                    {/* Branch Breakdown */}
                    <div className="stat-panel">
                        <div className="panel-header">
                            <GitBranch size={20} color="var(--text-main)" />
                            <h3>Largest Branches</h3>
                        </div>
                        <div className="branch-list">
                            {stats.branchSizes.map((branch, idx) => (
                                <div key={idx} className="branch-item">
                                    <div className="branch-info">
                                        <span className="branch-name">{branch.name}</span>
                                        <span className="branch-count">{branch.count} members</span>
                                    </div>
                                    <div className="progress-bg">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${(branch.count / stats.totalMembers) * 100}%`,
                                                background: `hsl(${200 + (idx * 30)}, 70%, 50%)`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fun Stats & Status */}
                    <div className="stat-column">


                        <div className="stat-panel compact">
                            <div className="panel-header">
                                <Baby size={20} color="#ec4899" />
                                <h3>Spouses Recorded</h3>
                            </div>
                            <div className="trophy-content">
                                <div className="trophy-value" style={{ color: '#ec4899' }}>{stats.totalSpouses}</div>
                                <div className="trophy-name">Partners by marriage</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
