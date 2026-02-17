import React, { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

export default function PositionManagement() {
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSportModal, setShowSportModal] = useState(false);
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [editingSport, setEditingSport] = useState(null);
    const [editingPosition, setEditingPosition] = useState(null);
    const [sportForm, setSportForm] = useState({ name: '', code: '' });
    const [positionForm, setPositionForm] = useState({ sport_id: '', name: '', code: '', default_quota: 1 });

    useEffect(() => {
        fetchSports();
    }, []);

    const fetchSports = async () => {
        try {
            const res = await api.get('/master/sports');
            setSports(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSport = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/sports', sportForm);
            setShowSportModal(false);
            setSportForm({ name: '', code: '' });
            setEditingSport(null);
            fetchSports();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleCreatePosition = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/positions', positionForm);
            setShowPositionModal(false);
            setPositionForm({ sport_id: '', name: '', code: '', default_quota: 1 });
            setEditingPosition(null);
            fetchSports();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteSport = async (id) => {
        if (!confirm('Delete this sport and all its positions?')) return;
        try {
            await api.delete(`/admin/sports/${id}`);
            fetchSports();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeletePosition = async (id) => {
        if (!confirm('Delete this position?')) return;
        try {
            await api.delete(`/admin/positions/${id}`);
            fetchSports();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const openSportModal = (sport = null) => {
        if (sport) {
            setEditingSport(sport);
            setSportForm({ name: sport.name, code: sport.code });
        } else {
            setEditingSport(null);
            setSportForm({ name: '', code: '' });
        }
        setShowSportModal(true);
    };

    const openPositionModal = (sport, position = null) => {
        if (position) {
            setEditingPosition(position);
            setPositionForm({ sport_id: sport.id || sport.ID, name: position.name, code: position.code, default_quota: position.default_quota });
        } else {
            setEditingPosition(null);
            setPositionForm({ sport_id: sport.id || sport.ID, name: '', code: '', default_quota: 1 });
        }
        setShowPositionModal(true);
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Position & Sport Management</h1>
                <button onClick={() => openSportModal()}>+ New Sport</button>
            </header>

            <Modal isOpen={showSportModal} onClose={() => setShowSportModal(false)} title={editingSport ? 'Edit Sport' : 'Create New Sport'}>
                <form onSubmit={handleCreateSport}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Sport Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={sportForm.name}
                            onChange={(e) => setSportForm({ ...sportForm, name: e.target.value })}
                            placeholder="e.g. Futsal"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Code</label>
                        <input
                            type="text"
                            className="input-field"
                            value={sportForm.code}
                            onChange={(e) => setSportForm({ ...sportForm, code: e.target.value })}
                            placeholder="e.g. futsal"
                            required
                        />
                    </div>
                    <button type="submit">{editingSport ? 'Update' : 'Create'}</button>
                </form>
            </Modal>

            <Modal isOpen={showPositionModal} onClose={() => setShowPositionModal(false)} title={editingPosition ? 'Edit Position' : 'Add Position'}>
                <form onSubmit={handleCreatePosition}>
                    <input type="hidden" value={positionForm.sport_id} />
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Position Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={positionForm.name}
                            onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                            placeholder="e.g. Forward"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Code</label>
                        <input
                            type="text"
                            className="input-field"
                            value={positionForm.code}
                            onChange={(e) => setPositionForm({ ...positionForm, code: e.target.value })}
                            placeholder="e.g. forward"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#f8fafc", fontWeight: "500" }}>Quota</label>
                        <input
                            type="number"
                            className="input-field"
                            value={positionForm.default_quota}
                            onChange={(e) => setPositionForm({ ...positionForm, default_quota: parseInt(e.target.value) })}
                            min="1"
                            required
                        />
                    </div>
                    <button type="submit">{editingPosition ? 'Update' : 'Create'}</button>
                </form>
            </Modal>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {sports.map(sport => (
                        <div key={sport.id || sport.name} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <h3>{sport.name}</h3>
                                    <span style={{ 
                                        padding: '0.25rem 0.75rem', 
                                        backgroundColor: '#3b82f6', 
                                        color: 'white', 
                                        borderRadius: '0.25rem',
                                        fontSize: '0.875rem'
                                    }}>
                                        {sport.code}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => openPositionModal(sport)} style={{ backgroundColor: '#10b981' }}>+ Position</button>
                                    <button onClick={() => openSportModal(sport)} style={{ backgroundColor: '#f59e0b' }}>Edit</button>
                                    <button onClick={() => handleDeleteSport(sport.id || sport.ID)} style={{ backgroundColor: '#ef4444' }}>Delete</button>
                                </div>
                            </div>
                            
                            <h4>Positions</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                                {sport.positions?.map(pos => (
                                    <div key={pos.id || pos.code} style={{ 
                                        padding: '0.75rem', 
                                        backgroundColor: '#334155', 
                                        borderRadius: '0.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid #475569'
                                    }}>
                                        <span style={{ color: '#f8fafc', fontWeight: '500' }}>{pos.name} <small style={{ color: '#94a3b8' }}>(x{pos.default_quota})</small></span>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button onClick={() => openPositionModal(sport, pos)} style={{ backgroundColor: '#f59e0b', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Edit</button>
                                            <button onClick={() => handleDeletePosition(pos.id || pos.ID)} style={{ backgroundColor: '#ef4444', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>X</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
