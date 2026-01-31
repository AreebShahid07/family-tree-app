import React from 'react';
import { FileSpreadsheet, ExternalLink, Phone } from 'lucide-react';
import '../index.css';

export default function DocumentsPage() {
    const sheets = [
        {
            title: "Family Database - Primary Record",
            url: "https://docs.google.com/spreadsheets/d/133O32uIOiNhBCP9NgtYaZXV59EPJEP1diqG57BIznJg/edit?usp=drivesdk",
            desc: "Comprehensive family data including dates and detailed notes."
        },
        {
            title: "Family Database - Secondary Record",
            url: "https://docs.google.com/spreadsheets/d/1e6GX2urVf6sU2trEfbNuPCZop_XsrJtxIvE16C6HlEc/edit?usp=drivesdk",
            desc: "Additional family records and extended branch information."
        }
    ];

    return (
        <div className="page-container" style={{ alignItems: 'center' }}>
            <div className="content-wrapper" style={{ maxWidth: '700px' }}>
                <div className="page-header">
                    <h2 style={{ margin: 0 }}>Detailed Records</h2>
                </div>

                <p className="history-text" style={{ marginBottom: '30px' }}>
                    For deeper insights and historical data not available in the interactive tree,
                    please refer to the official master spreadsheets below.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {sheets.map((sheet, index) => (
                        <a
                            key={index}
                            href={sheet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cta-card"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}
                        >
                            <div className="icon-wrapper" style={{ marginBottom: 0, background: '#e0f2fe', color: '#0284c7' }}>
                                <FileSpreadsheet size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {sheet.title}
                                    <ExternalLink size={14} color="#94a3b8" />
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{sheet.desc}</p>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Credits Section */}
                <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px dashed var(--card-border)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                        Database Credits
                    </h3>
                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <p style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Safdar Yaqoob Ali</p>
                                <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                                    Chief Archivist & Database Creator
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
                                <Phone size={16} color="var(--accent)" />
                                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>+92 333 9913155</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
