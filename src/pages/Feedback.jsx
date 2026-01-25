
import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

export default function FeedbackPage({ cloudUrl }) {
    const [formData, setFormData] = useState({ name: '', rating: '5', message: '' });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            await fetch(cloudUrl, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "feedback",
                    ...formData
                })
            });
            setStatus('success');
            setFormData({ name: '', rating: '5', message: '' });
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="page-container content-page">
            <div className="content-wrapper text-center">
                <h2>Feedback & Corrections</h2>
                <p className="subtitle">Found a mistake? Want to add a member? Let us know.</p>

                <form className="feedback-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Ali Ahmed"
                        />
                    </div>

                    <div className="form-group">
                        <label>Rating</label>
                        <select
                            value={formData.rating}
                            onChange={e => setFormData({ ...formData, rating: e.target.value })}
                        >
                            <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                            <option value="4">⭐⭐⭐⭐ - Good</option>
                            <option value="3">⭐⭐⭐ - Okay</option>
                            <option value="2">⭐⭐ - Needs Work</option>
                            <option value="1">⭐ - Poor</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Message / Correction</label>
                        <textarea
                            required
                            rows="5"
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Tell us what you think or report an error in the tree..."
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={status === 'submitting'}>
                        {status === 'submitting' ? 'Sending...' : (
                            <>
                                <span>Submit Feedback</span>
                                <Send size={16} />
                            </>
                        )}
                    </button>

                    {status === 'success' && (
                        <div className="status-msg success">
                            <CheckCircle size={20} />
                            <span>Message saved to Cloud! Thank you.</span>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="status-msg error">
                            <AlertCircle size={20} />
                            <span>Something went wrong. Please try again.</span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
