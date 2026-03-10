import React, { useRef, useEffect } from 'react';

const ChatInput = ({ value, onChange, onSubmit, isLoading }) => {
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  };

  const canSend = !isLoading && value.trim().length > 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '10px',
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '14px',
      padding: '8px 8px 8px 16px',
    }}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message NexusAI... (Enter to send)"
        disabled={isLoading}
        rows={1}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#fff',
          fontSize: '15px',
          lineHeight: 1.5,
          resize: 'none',
          maxHeight: '200px',
          overflowY: 'auto',
          fontFamily: "'Inter', sans-serif",
          padding: '6px 0',
        }}
      />
      <button
        onClick={() => canSend && onSubmit()}
        disabled={!canSend}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: 'none',
          cursor: canSend ? 'pointer' : 'not-allowed',
          fontSize: '20px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s',
          background: canSend
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'rgba(255,255,255,0.08)',
          color: canSend ? '#fff' : 'rgba(255,255,255,0.3)',
          boxShadow: canSend ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
        }}
      >
        {isLoading ? '⏳' : '↑'}
      </button>
    </div>
  );
};

export default ChatInput;
