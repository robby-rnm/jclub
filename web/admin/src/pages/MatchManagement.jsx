import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

export default function MatchManagement() {
    const [matches, setMatches] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        game_type: 'football',
        club_id: '',
        date: '',
        time: '',
        location: '',
        price: 0,
        max_players: 28
    });
    const [editingId, setEditingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [matchesRes, clubsRes] = await Promise.all([
                api.get('/matches'),
                api.get('/clubs')
            ]);
            setMatches(matchesRes.data || []);
            setClubs(clubsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, status: 'draft' };
            if (editingId) {
                await api.put(`/matches/${editingId}`, payload);
            } else {
                await api.post('/matches', payload);
            }
            setFormData({
                title: '',
                description: '',
                game_type: 'football',
                club_id: '',
                date: '',
                time: '',
                location: '',
                price: 0,
                max_players: 28
            });
            setEditingId(null);
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const openModal = (match = null) => {
        if (match) {
            const matchDate = new Date(match.date);
            setFormData({
                title: match.title,
                description: match.description || '',
                game_type: match.game_type || 'football',
                club_id: match.club_id || '',
                date: matchDate.toISOString().split('T')[0],
                time: matchDate.toTimeString().slice(0, 5),
                location: match.location || '',
                price: match.price || 0,
                max_players: match.max_players || 28
            });
            setEditingId(match.id);
        } else {
            setFormData({
                title: '',
                description: '',
                game_type: 'football',
                club_id: '',
                date: '',
                time: '',
                location: '',
                price: 0,
                max_players: 28
            });
            setEditingId(null);
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this match?')) return;
        try {
            await api.delete(`/matches/${id}`);
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handlePublish = async (id) => {
        try {
            await api.put(`/matches/${id}`, { status: 'published' });
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Match Management</h1>
                <button onClick={() => openModal()}>+ New Match</button>
            </header>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Match' : 'Create New Match'}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Title</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Game Type</label>
                            <select
                                className="input-field"
                                value={formData.game_type}
                                onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}
                            >
                                <option value="football">Football</option>
                                <option value="futsal">Futsal</option>
                                <option value="mini_soccer">Mini Soccer</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Club</label>
                            <select
                                className="input-field"
                                value={formData.club_id}
                                onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                                required
                            >
                                <option value="">Select Club</option>
                                {clubs.map(club => (
                                    <option key={club.id} value={club.id}>{club.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Time</label>
                            <input
                                type="time"
                                className="input-field"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Location</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Price</label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Max Players</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.max_players}
                            onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Description</label>
                        <textarea
                            className="input-field"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <button type="submit">{editingId ? 'Update' : 'Create'}</button>
                </form>
            </Modal>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {matches.map(match => (
                        <div key={match.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3>{match.title}</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                                    {new Date(match.date).toLocaleDateString()} - {match.location}
                                </p>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    backgroundColor: match.status === 'published' ? '#059669' : match.status === 'cancelled' ? '#dc2626' : '#d97706',
                                    color: 'white',
                                    textTransform: 'uppercase'
                                }}>
                                    {match.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => navigate(`/match/${match.id}`)} style={{ backgroundColor: '#3b82f6' }}>View</button>
                                <button onClick={() => openModal(match)} style={{ backgroundColor: '#f59e0b' }}>Edit</button>
                                {match.status === 'draft' && (
                                    <button onClick={() => handlePublish(match.id)} style={{ backgroundColor: '#10b981' }}>Publish</button>
                                )}
                                <button onClick={() => handleDelete(match.id)} style={{ backgroundColor: '#ef4444' }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
