
import React from 'react';
import { Link } from 'react-router-dom';
import { Network, History } from 'lucide-react';

export default function Home() {
    return (
        <div className="page-container home-page">
            <div className="hero-section">
                <h1>Legacy & <span>Lineage</span></h1>
                <p className="subtitle">Explore the rich history and connections of our family. A digital archive for generations to come.</p>

                <div className="cta-group">
                    <Link to="/tree" className="cta-card primary">
                        <div className="icon-wrapper">
                            <Network size={32} />
                        </div>
                        <h3>Explore the Tree</h3>
                        <p>Interactive visualization of the entire family hierarchy.</p>
                    </Link>

                    <Link to="/history" className="cta-card secondary">
                        <div className="icon-wrapper">
                            <History size={32} />
                        </div>
                        <h3>Read Our History</h3>
                        <p>Discover the stories behind the names. (Urdu & English)</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
