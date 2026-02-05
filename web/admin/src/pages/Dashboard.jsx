import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [matches, setMatches] = useState([]);
    const [newMatchDate, setNewMatchDate] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const res = await api.get('/matches');
            setMatches(res.data || []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const createMatch = async () => {
        if (!newMatchDate) {
            alert('Select a date');
            return;
        }

        try {
            await api.post('/matches', { date: newMatchDate });
            alert('Match created!');
            setNewMatchDate('');
            fetchMatches();
        } catch (err) {
            console.error(err);
            alert('Failed to create match. ' + (err.response?.data?.error || err.message));
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="container">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h1>Matches Dashboard</h1>
                <button onClick={handleLogout} style={{ backgroundColor: '#ef4444' }}>
                    Logout
                </button>
            </header>

            <div className="card" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
                <h2 style={{ marginBottom: '1rem' }}>Create New Match</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>
                            Select Date for Next Match
                        </label>
                        <input
                            type="date"
                            className="input-field"
                            value={newMatchDate}
                            onChange={(e) => setNewMatchDate(e.target.value)}
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                    <button onClick={createMatch}>
                        Create Match
                    </button>
                </div>
            </div>

            <h2 style={{ marginBottom: '1rem' }}>Upcoming Matches</h2>

            <div className="grid">
                {matches.map(match => (
                    <div
                        key={match.ID}
                        className="card match-item"
                        style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}
                        onClick={() => navigate(`/match/${match.ID}`)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                                {new Date(match.Date).toLocaleDateString()}
                            </h3>
                            <span className={`badge ${match.Status === 'open' ? 'badge-open' : 'badge-waitlist'}`}>
                                {match.Status}
                            </span>
                        </div>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                            <span>Click to manage bookings & teams</span>
                        </div>
                    </div>
                ))}

                {matches.length === 0 && (
                    <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        No matches found. Create one above.
                    </p>
                )}
            </div>
        </div>
    );
}
