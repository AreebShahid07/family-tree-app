
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { loginAdmin } from '../services/dataService';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('idle');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const result = await loginAdmin(username, password);

            if (result?.ok) {
                navigate('/admin/dashboard');
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error("Login attempt failed:", err);
            setStatus('error');
        }
    };

    return (
        <div className="page-container content-page">
            <div className="content-wrapper" style={{ maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ color: 'var(--accent)', marginBottom: '20px' }}>
                    <Lock size={48} />
                </div>
                <h2>Family Admin</h2>
                <p className="subtitle">Secure Admin Login</p>

                <form onSubmit={handleLogin} className="feedback-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {status === 'error' && (
                        <div className="status-msg error" style={{ marginBottom: 16 }}>
                            Login failed. Check admin credentials.
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Verifying...' : 'Login to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}
