import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Stats() {
    const [stats, setStats] = useState({
        totalMatches: 0,
        totalClubs: 0,
        totalUsers: 0,
        publishedMatches: 0,
        draftMatches: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [matchesRes, clubsRes] = await Promise.all([
                api.get('/matches'),
                api.get('/clubs')
            ]);
            
            const matches = matchesRes.data || [];
            const clubs = clubsRes.data || [];
            
            // Get unique users from clubs
            const userSet = new Set();
            clubs.forEach(club => {
                if (club.creator) {
                    userSet.add(club.creator.id);
                }
            });

            setStats({
                totalMatches: matches.length,
                totalClubs: clubs.length,
                totalUsers: userSet.size,
                publishedMatches: matches.filter(m => m.status === 'published').length,
                draftMatches: matches.filter(m => m.status === 'draft').length
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, color, icon }) => (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color }}>{value}</div>
            <div style={{ color: 'var(--text-dim)' }}>{title}</div>
        </div>
    );

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Analytics & Statistics</h1>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard title="Total Matches" value={stats.totalMatches} color="#3b82f6" icon="⚽" />
                <StatCard title="Published" value={stats.publishedMatches} color="#10b981" icon="✅" />
                <StatCard title="Draft" value={stats.draftMatches} color="#f59e0b" icon="📝" />
                <StatCard title="Total Clubs" value={stats.totalClubs} color="#8b5cf6" icon="👥" />
                <StatCard title="Total Users" value={stats.totalUsers} color="#ec4899" icon="👤" />
            </div>

            <div className="card">
                <h3>Quick Summary</h3>
                <ul style={{ lineHeight: '2' }}>
                    <li>There are <strong>{stats.publishedMatches}</strong> published matches ready for booking</li>
                    <li><strong>{stats.draftMatches}</strong> matches are still in draft mode</li>
                    <li>You have <strong>{stats.totalClubs}</strong> clubs in the system</li>
                    <li><strong>{stats.totalUsers}</strong> unique users have created clubs</li>
                </ul>
            </div>
        </div>
    );
}
