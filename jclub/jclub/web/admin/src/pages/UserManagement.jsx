import React, { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
    const [roleForm, setRoleForm] = useState({ role: 'user' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setFormData({ name: '', email: '', password: '', phone: '' });
        setEditingUser(null);
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setFormData({ name: user.name || '', email: user.email || '', password: '', phone: user.phone || '' });
        setEditingUser(user);
        setShowModal(true);
    };

    const openRoleModal = (user) => {
        setEditingUser(user);
        setRoleForm({ role: user.role || 'user' });
        setShowRoleModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update - only send non-empty fields
                const updateData = {};
                if (formData.name) updateData.name = formData.name;
                if (formData.phone) updateData.phone = formData.phone;
                await api.put(`/admin/users/${editingUser.id}`, updateData);
            } else {
                // Create
                await api.post('/admin/users', formData);
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleUpdateRole = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${editingUser.id}/role`, roleForm);
            setShowRoleModal(false);
            fetchUsers();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this user? This action cannot be undone.')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>User Management</h1>
                <button onClick={openCreateModal}>+ New User</button>
            </header>

            {/* Create/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit User' : 'Create New User'}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required={!editingUser}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={editingUser}
                            required={!editingUser}
                        />
                    </div>
                    {!editingUser && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                            />
                        </div>
                    )}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>Phone</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <button type="submit">{editingUser ? 'Update' : 'Create'}</button>
                </form>
            </Modal>

            {/* Role Modal */}
            <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Edit User Role">
                <form onSubmit={handleUpdateRole}>
                    <p style={{ color: '#94a3b8', marginBottom: '1rem' }}><strong>{editingUser?.name}</strong><br/>{editingUser?.email}</p>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '500' }}>Role</label>
                        <select
                            className="input-field"
                            value={roleForm.role}
                            onChange={(e) => setRoleForm({ role: e.target.value })}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button type="submit">Update Role</button>
                </form>
            </Modal>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Phone</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Provider</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Role</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{user.name}</td>
                                    <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{user.email}</td>
                                    <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{user.phone || '-'}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{ 
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            backgroundColor: user.provider === 'local' ? '#2563eb' : '#7c3aed',
                                            color: 'white',
                                            textTransform: 'uppercase'
                                        }}>
                                            {user.provider}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{ 
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            backgroundColor: user.role === 'admin' ? '#dc2626' : '#059669',
                                            color: 'white',
                                            textTransform: 'uppercase'
                                        }}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => openEditModal(user)} style={{ backgroundColor: '#f59e0b', fontSize: '0.7rem' }}>Edit</button>
                                            <button onClick={() => openRoleModal(user)} style={{ backgroundColor: '#8b5cf6', fontSize: '0.7rem' }}>Role</button>
                                            <button onClick={() => handleDelete(user.id)} style={{ backgroundColor: '#ef4444', fontSize: '0.7rem' }}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No users found</p>
                    )}
                </div>
            )}
        </div>
    );
}
