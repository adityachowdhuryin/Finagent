import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}

export default function ChatHistorySidebar() {
  const { sessions, currentSessionId, loadSession, newSession, deleteSession } = useChat();
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [search, setSearch] = useState('');

  const filteredSessions = (sessions || []).filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-ghost"
        style={{ padding: '0.5rem', alignSelf: 'flex-start' }}
      >
        ☰
      </button>
    );
  }

  return (
    <div style={{
      width: '280px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--glass-border)',
      background: 'var(--surface)',
      flexShrink: 0,
      transition: 'all 0.3s'
    }}>
      <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)' }}>
        <h3 className="text-h3">Chat History</h3>
        <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.5rem' }}>×</button>
      </div>
      
      <div style={{ padding: '1rem' }}>
        <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={newSession}>
          + New Chat
        </button>
        <input 
          type="text" 
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem' }}>
        {filteredSessions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem' }}>
            No conversations yet. Ask FinAgent anything!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredSessions.map(session => (
              <div 
                key={session.id}
                onClick={() => loadSession(session.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  background: currentSessionId === session.id ? 'var(--surface-raised)' : 'transparent',
                  border: `1px solid ${currentSessionId === session.id ? 'var(--glass-border)' : 'transparent'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                    {session.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {formatRelativeTime(session.updatedAt)}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0.25rem', color: 'var(--red)', opacity: 0.7 }}
                  title="Delete Session"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
