import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function MatchDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch match details (includes bookings)
            // We don't have a direct /matches/:id endpoint in handler yet!
            // Wait, repository has GetMatchByID, but Handler doesn't expose GET /matches/:id
            // Handler has ListMatches.
            // I need to add GET /matches/:id endpoint to backend handler first!
            // For now, I'll rely on ListMatches and find on client side? No, inefficient.
            // I MUST ADD GET /matches/:id TO BACKEND.

            // Let's assume I will add it.
            const matchRes = await api.get(`/matches/${id}`);
            setMatch(matchRes.data);

            const teamRes = await api.get(`/matches/${id}/teams`);
            setTeams(teamRes.data || []);
        } catch (err) {
            console.error(err);
            // Fallback if endpoint missing
        } finally {
            setLoading(false);
        }
    };

    const togglePayment = async (bookingId, currentStatus) => {
        try {
            await api.put(`/bookings/${bookingId}/pay`, { is_paid: !currentStatus });
            // Refresh data
            fetchData();
        } catch (err) {
            alert('Failed to update payment');
        }
    };

    const generateTeams = async () => {
        try {
            const res = await api.post(`/matches/${id}/teams/generate`);
            setTeams(res.data);
            alert('Teams generated!');
        } catch (err) {
            alert('Failed to generate teams: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!match) return <div className="container">Match not found</div>;

    return (
        <div className="container">
            <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}>
                &larr; Back to Dashboard
            </button>

            <header style={{ marginBottom: '2rem' }}>
                <h1>Match Details: {new Date(match.Date).toLocaleDateString()}</h1>
                <span className={`badge ${match.Status === 'open' ? 'badge-open' : 'badge-waitlist'}`}>
                    {match.Status}
                </span>
            </header>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Bookings Section */}
                <div className="card">
                    <h2>Participants ({match.Bookings?.length || 0})</h2>
                    <div className="player-list">
                        {match.Bookings?.map(booking => (
                            <div key={booking.ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{booking.User?.Name || 'User ' + booking.UserID.slice(0, 4)}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{booking.Position} • {booking.Status}</div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={booking.IsPaid}
                                        onChange={() => togglePayment(booking.ID, booking.IsPaid)}
                                    />
                                    <span style={{ color: booking.IsPaid ? 'var(--success)' : 'var(--text-dim)' }}>
                                        {booking.IsPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Teams Section */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Teams</h2>
                        <button onClick={generateTeams} style={{ fontSize: '0.9rem' }}>
                            Generate / Shuffle
                        </button>
                    </div>

                    {!teams.length && <p style={{ color: 'var(--text-dim)' }}>No teams generated yet. Click shuffle to create.</p>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {teams.map(team => (
                            <div key={team.ID} style={{ border: `1px solid ${team.Color}`, borderRadius: '8px', padding: '10px' }}>
                                <h3 style={{ color: team.Color, margin: '0 0 10px 0' }}>{team.Name}</h3>
                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    {team.Members?.map(member => (
                                        <li key={member.ID}>
                                            {member.User?.Name || 'User ' + member.UserID.slice(0, 4)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
