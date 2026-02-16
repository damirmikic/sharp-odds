import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function UserMenu({ onOpenHistory }) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 4,
          padding: '6px 12px',
          color: 'var(--text-primary)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--odds-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: 'white',
        }}>
          {user.email?.[0]?.toUpperCase()}
        </span>
        <span>{user.email?.split('@')[0]}</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 4,
          minWidth: 180,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 100,
        }}>
          <div style={{
            padding: 12,
            borderBottom: '1px solid var(--border-primary)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}>
            {user.email}
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenHistory?.();
            }}
            style={{
              width: '100%',
              padding: 12,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
              borderBottom: '1px solid var(--border-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            📚 Betslip History
          </button>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: 12,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
