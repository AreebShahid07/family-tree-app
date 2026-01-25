
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Network, History, MessageSquare } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-brand">
                    Family<span>Origins</span>
                </Link>
                <div className="nav-links">
                    <Link to="/" className={`nav-item ${isActive('/')}`}>
                        <Home size={18} />
                        <span>Home</span>
                    </Link>
                    <Link to="/tree" className={`nav-item ${isActive('/tree')}`}>
                        <Network size={18} />
                        <span>Tree</span>
                    </Link>
                    <Link to="/history" className={`nav-item ${isActive('/history')}`}>
                        <History size={18} />
                        <span>History</span>
                    </Link>
                    <Link to="/feedback" className={`nav-item ${isActive('/feedback')}`}>
                        <MessageSquare size={18} />
                        <span>Feedback</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
