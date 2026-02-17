import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        try {
            // For now, mock token. In production, use Google/FB OAuth flow.
            const res = await api.post('/login', {
                provider: 'google',
                token: 'mock-admin-token'
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user)); // Just strictly for display
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Login failed. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="card auth-form" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Admin Login</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '2rem' }}>
                    Reserve Game Administration Panel
                </p>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                >
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                    Secure Access Only
                </div>
            </div>
        </div>
    );
}
