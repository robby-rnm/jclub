import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                border: '1px solid #334155',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: '#94a3b8', padding: '0', lineHeight: 1 }}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}
