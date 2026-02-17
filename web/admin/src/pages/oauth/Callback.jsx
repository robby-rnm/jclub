import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';

export default function OAuthCallback() {
    const [status, setStatus] = useState('Processing...');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        if (error) {
            setStatus('Error: ' + error);
            return;
        }
        
        if (code) {
            // Exchange code for token
            handleOAuthCallback(code);
        } else {
            setStatus('No authorization code received');
        }
    }, [searchParams]);

    const handleOAuthCallback = async (code) => {
        try {
            const res = await api.post('/login', {
                provider: 'google',
                token: code,
            });
            
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            console.error('OAuth callback error:', err);
            setStatus('Login failed: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#0f172a',
            color: '#fff'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2>{status}</h2>
                <p>Please wait...</p>
            </div>
        </div>
    );
}
