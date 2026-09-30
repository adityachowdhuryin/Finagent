import React from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell({ unreadCount, onClick }) {
  return (
    <button
      className="btn btn-ghost btn-icon"
      onClick={onClick}
      style={{ position: 'relative' }}
      title={`${unreadCount} unread alerts`}
      aria-label="Notifications"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          minWidth: 16, height: 16, borderRadius: 999,
          background: 'var(--red)', color: 'white',
          fontSize: '0.6rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg)', padding: '0 3px',
          animation: unreadCount > 0 ? 'pulse-dot 2s ease infinite' : 'none',
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
