import React, { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

export default function ClubManagement() {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const res = await api.get('/clubs');
            setClubs(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/clubs/${editingId}`, formData);
            } else {
                await api.post('/clubs', formData);
            }
            setFormData({ name: '', description: '' });
            setEditingId(null);
            setShowModal(false);
            fetchClubs();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const openModal = (club = null) => {
        if (club) {
            setFormData({ name: club.name, description: club.description });
            setEditingId(club.id);
        } else {
            setFormData({ name: '', description: '' });
            setEditingId(null);
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this club?')) return;
        try {
            await api.delete(`/clubs/${id}`);
            fetchClubs();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Club Management</h1>
                <button onClick={() => openModal()}>+ New Club</button>
            </header>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Club' : 'Create New Club'}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Club Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {clubs.map(club => (
                        <div key={club.id} className="card">
                            <h3>{club.name}</h3>
                            <p style={{ color: 'var(--text-dim)' }}>{club.description || 'No description'}</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                Members: {club.member_count || 0}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button onClick={() => openModal(club)} style={{ backgroundColor: '#3b82f6' }}>Edit</button>
                                <button onClick={() => handleDelete(club.id)} style={{ backgroundColor: '#ef4444' }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
