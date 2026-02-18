import React from 'react';
import { BrowserRouter, Route, Routes, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MatchDetails from './pages/MatchDetails';
import ClubManagement from './pages/ClubManagement';
import MatchManagement from './pages/MatchManagement';
import UserManagement from './pages/UserManagement';
import Stats from './pages/Stats';
import PositionManagement from './pages/PositionManagement';

function PrivateRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function Navigation() {
  const location = useLocation();
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/stats', label: 'Stats', icon: '📊' },
    { path: '/matches', label: 'Matches', icon: '⚽' },
    { path: '/clubs', label: 'Clubs', icon: '👥' },
    { path: '/positions', label: 'Positions', icon: '🎯' },
    { path: '/users', label: 'Users', icon: '👤' },
  ];

  return (
    <nav style={{
      backgroundColor: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      padding: '1rem',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>JClub Admin</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                backgroundColor: location.pathname === item.path ? 'var(--primary)' : 'transparent',
                color: location.pathname === item.path ? 'white' : 'var(--text)',
                transition: 'all 0.2s'
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          style={{ backgroundColor: '#ef4444' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Navigation /><Dashboard /></PrivateRoute>} />
        <Route path="/stats" element={<PrivateRoute><Navigation /><Stats /></PrivateRoute>} />
        <Route path="/matches" element={<PrivateRoute><Navigation /><MatchManagement /></PrivateRoute>} />
        <Route path="/clubs" element={<PrivateRoute><Navigation /><ClubManagement /></PrivateRoute>} />
        <Route path="/positions" element={<PrivateRoute><Navigation /><PositionManagement /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><Navigation /><UserManagement /></PrivateRoute>} />
        <Route path="/match/:id" element={<PrivateRoute><Navigation /><MatchDetails /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
