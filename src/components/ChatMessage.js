import React from 'react';

const ChatMessage = ({ message, userPhotoURL, userInitial }) => {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '10px',
      flexDirection: isUser ? 'row-reverse' : 'row',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Avatar */}
      {isUser ? (
        userPhotoURL ? (
          <img src={userPhotoURL} alt="user" style={avatarStyle} />
        ) : (
          <div style={{ ...avatarStyle, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
            {userInitial}
          </div>
        )
      ) : (
        <div style={{ ...avatarStyle, background: isError ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: isError ? '#f87171' : '#fff' }}>
          {isError ? '!' : '✦'}
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '70%',
        padding: '12px 16px',
        borderRadius: '16px',
        fontSize: '15px',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...(isUser
          ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderBottomRightRadius: '4px' }
          : isError
          ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', borderBottomLeftRadius: '4px' }
          : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', borderBottomLeftRadius: '4px' }
        ),
      }}>
        {message.text}
      </div>
    </div>
  );
};

const avatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  flexShrink: 0,
  objectFit: 'cover',
};

export default ChatMessage;
