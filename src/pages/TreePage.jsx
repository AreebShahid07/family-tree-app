
import React, { useRef, useState, useEffect } from 'react';
import Tree from 'react-d3-tree';
import '../index.css';

// --- ICONS ---
const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const MapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

// --- CONTROL ICONS ---
const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const CenterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const FullScreenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>;

const NodeCard = ({ nodeDatum, toggleNode, orientation }) => {
    const { name, dob, spouse, location, status } = nodeDatum;
    const hasSpouse = spouse && spouse !== "Unknown";
    const hasDob = dob;
    const hasLoc = location;
    const isDeceased = status === 'Deceased';
    const childrenCount = nodeDatum.children ? nodeDatum.children.length : 0;

    const xOffset = orientation === 'horizontal' ? -10 : -100;
    const yOffset = orientation === 'horizontal' ? -40 : -40;

    return (
        <foreignObject width="240" height="140" x={xOffset} y={yOffset} style={{ overflow: 'visible' }}>
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
                            {hasDob && (
                                <div className="node-row">
                                    <span className="node-icon"><CalendarIcon /></span>
                                    <span className="node-value">
                                        {dob} {isDeceased && nodeDatum.dod ? ` to ${nodeDatum.dod}` : ''}
                                    </span>
                                </div>
                            )}
                            {hasLoc && (
                                <div className="node-row">
                                    <span className="node-icon"><MapIcon /></span>
                                    <span className="node-value">{location}</span>
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
};

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

    const handleZoom = (delta) => setZoom(prev => Math.min(Math.max(0.2, prev + delta), 4));

    if (!treeData) return <div className="page-container">No records found.</div>;

    return (
        <div className="tree-container" ref={treeContainerRef}>
            <Tree
                data={treeData}
                translate={translate}
                scale={zoom}
                renderCustomNodeElement={(rd3tProps) => <NodeCard {...rd3tProps} orientation={orientation} />}
                orientation={orientation}
                initialDepth={1}
                pathFunc="step"
                separation={orientation === 'horizontal' ? { siblings: 1.5, nonSiblings: 2 } : { siblings: 2, nonSiblings: 2.5 }}
                enableLegacyTransitions={true}
                transitionDuration={400}
                zoomable={true}
                draggable={true}
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
                    <button className="control-btn" title="Zoom In" onClick={() => handleZoom(0.2)}><ZoomInIcon /></button>
                    <button className="control-btn" title="Zoom Out" onClick={() => handleZoom(-0.2)}><ZoomOutIcon /></button>
                </div>
            </div>
        </div>
    );
}
