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
                const updateData = {};
                if (formData.name) updateData.name = formData.name;
                if (formData.phone) updateData.phone = formData.phone;
                await api.put(`/admin/users/${editingUser.id}`, updateData);
            } else {
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
        if (!confirm('Delete this user?')) return;
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit User' : 'Create New User'}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required={!editingUser}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
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
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                            />
                        </div>
                    )}
                    <button type="submit">{editingUser ? 'Update' : 'Create'}</button>
                </form>
            </Modal>

            <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Edit User Role">
                <form onSubmit={handleUpdateRole}>
                    <p><strong>{editingUser?.name}</strong><br/>{editingUser?.email}</p>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
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

            <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: '300px', marginBottom: '1rem' }}
            />

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="card">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span style={{ 
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: user.role === 'admin' ? '#dc2626' : '#059669',
                                            color: 'white'
                                        }}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => openEditModal(user)}>Edit</button>
                                        <button onClick={() => openRoleModal(user)}>Role</button>
                                        <button onClick={() => handleDelete(user.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
