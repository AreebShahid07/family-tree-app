
import React, { useRef, useState, useEffect } from 'react';
import Tree from 'react-d3-tree';
import '../index.css';

// --- ICONS ---
import { Heart, Users as UsersIcon } from 'lucide-react';

// --- ICONS (Beautiful Lucide Icons) ---
const HeartIcon = () => <Heart size={12} fill="#ef4444" color="#ef4444" />;
const UserIcon = () => <UsersIcon size={12} color="var(--accent)" />;

// --- CONTROL ICONS ---

const CenterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const FullScreenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>;

const NodeCard = React.memo(({ nodeDatum, toggleNode, orientation }) => {
    const { name, spouse, status } = nodeDatum;
    const hasSpouse = spouse && spouse !== "Unknown";
    const isDeceased = status === 'Deceased';
    const childrenCount = nodeDatum.children ? nodeDatum.children.length : 0;

    const xOffset = orientation === 'horizontal' ? -10 : -100;
    const yOffset = orientation === 'horizontal' ? -40 : -40;

    return (
        <foreignObject width="240" height="140" x={xOffset} y={yOffset} className="node-foreign-object">
            <div className={`node-card ${isDeceased ? 'deceased' : 'alive'}`} onClick={toggleNode}>
                <div className="node-wrapper">
                    <div className="node-content">
                        <div className="node-header">
                            <div className="status-dot-container" title={isDeceased ? 'Deceased' : 'Alive'}>
                                <div className={`status-dot ${isDeceased ? 'deceased' : 'alive'}`}></div>
                            </div>
                            <span className="node-name" title={name}>{name}</span>
                        </div>
                        <div className="node-details">
                            {hasSpouse && (
                                <div className="node-row" title={`Spouse: ${spouse}`}>
                                    <span className="node-icon"><HeartIcon /></span>
                                    <span className="node-value">{spouse}</span>
                                </div>
                            )}
                            {childrenCount > 0 && nodeDatum.__rd3t.collapsed && (
                                <div className="node-row collapsed-warning">
                                    <span className="node-icon"><UserIcon /></span>
                                    <span>{childrenCount} more...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </foreignObject>
    );
});

export default function TreePage({ theme, setTheme, treeData }) {
    const [zoom, setZoom] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [orientation, setOrientation] = useState('vertical');
    const [showSettings, setShowSettings] = useState(false);
    const treeContainerRef = useRef(null);

    const handleCenteredTree = (el) => {
        if (!el) return;
        const { width, height } = el.getBoundingClientRect();
        if (orientation === 'horizontal') {
            setTranslate({ x: 100, y: height / 2 });
        } else {
            setTranslate({ x: width / 2, y: 80 });
        }
        setZoom(1);
    };

    useEffect(() => {
        if (treeContainerRef.current) handleCenteredTree(treeContainerRef.current);
    }, [treeData]); // Re-center if data changes

    const toggleOrientation = (newOr) => {
        setOrientation(newOr);
        setTimeout(() => handleCenteredTree(treeContainerRef.current), 50);
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
    };



    // Sort data for consistent display order
    const sortedTreeData = React.useMemo(() => {
        if (!treeData) return null;
        const sortRecursive = (node) => {
            const newNode = { ...node };
            if (newNode.children) {
                newNode.children = [...newNode.children].sort((a, b) =>
                    (a.branch_id || '').localeCompare(b.branch_id || '', undefined, { numeric: true })
                );
                newNode.children = newNode.children.map(sortRecursive);
            }
            return newNode;
        };
        // Handle if treeData is array or object
        if (Array.isArray(treeData)) return treeData.map(sortRecursive);
        return sortRecursive(treeData);
    }, [treeData]);

    if (!sortedTreeData) return <div className="page-container">No records found.</div>;

    return (
        <div className="tree-container" ref={treeContainerRef}>
            <Tree
                data={sortedTreeData}
                translate={translate}
                scale={zoom}
                renderCustomNodeElement={(rd3tProps) => <NodeCard {...rd3tProps} orientation={orientation} />}
                orientation={orientation}
                initialDepth={1}
                pathFunc="step"
                separation={orientation === 'horizontal' ? { siblings: 1.5, nonSiblings: 2 } : { siblings: 2, nonSiblings: 2.5 }}
                enableLegacyTransitions={false}
                transitionDuration={0}
                zoomable={true}
                draggable={true}
                shouldUpdateComponent={true}
            />
            <div className="controls-panel">
                <button className="settings-toggle" onClick={() => setShowSettings(!showSettings)} style={{ marginBottom: '16px' }} title="Settings">
                    <SettingsIcon />
                </button>
                {showSettings && (
                    <div className="settings-menu" style={{ bottom: 'auto', top: '-10px', right: '70px', transformOrigin: 'top right' }}>
                        <div className="settings-group">
                            <h3>Layout</h3>
                            <div className="style-options">
                                <button className={`style-btn ${orientation === 'vertical' ? 'active' : ''}`} onClick={() => toggleOrientation('vertical')}>Vertical</button>
                                <button className={`style-btn ${orientation === 'horizontal' ? 'active' : ''}`} onClick={() => toggleOrientation('horizontal')}>Horizontal</button>
                            </div>
                        </div>
                        <div className="settings-group">
                            <h3>Theme</h3>
                            <div className="theme-grid">
                                <div className="theme-btn" style={{ background: '#0f172a' }} onClick={() => setTheme('theme-blue')} />
                                <div className="theme-btn" style={{ background: '#022c22' }} onClick={() => setTheme('theme-green')} />
                                <div className="theme-btn" style={{ background: '#4a044e' }} onClick={() => setTheme('theme-purple')} />
                                <div className="theme-btn" style={{ background: '#2c0410' }} onClick={() => setTheme('theme-crimson')} />
                                <div className="theme-btn" style={{ background: '#f1f5f9', border: '1px solid #94a3b8' }} onClick={() => setTheme('theme-light')} />
                            </div>
                        </div>
                    </div>
                )}
                <div className="zoom-group">
                    <button className="control-btn" title="Full Screen" onClick={toggleFullScreen}><FullScreenIcon /></button>
                    <div style={{ height: 1, background: 'var(--card-border)', margin: '4px 0' }}></div>
                    <button className="control-btn" title="Center" onClick={() => handleCenteredTree(treeContainerRef.current)}><CenterIcon /></button>
                </div>
            </div>
        </div>
    );
}
