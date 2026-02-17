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

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No Date';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return 'Invalid Date';
        }
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
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
                        key={match.id}
                        className="card match-item"
                        style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}
                        onClick={() => navigate(`/match/${match.id}`)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <h3 style={{ margin: 0, color: '#8b5cf6' }}>
                                {match.title || 'Untitled Match'}
                            </h3>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                backgroundColor: match.status === 'published' ? '#059669' : '#d97706',
                                color: 'white',
                                textTransform: 'uppercase'
                            }}>
                                {match.status || 'draft'}
                            </span>
                        </div>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                            <span>{formatDate(match.date)}</span>
                            <span>{match.location || 'No location'}</span>
                        </div>
                    </div>
                ))}

                {matches.length === 0 && (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        No matches found. Create one above.
                    </p>
                )}
            </div>
        </div>
    );
}
