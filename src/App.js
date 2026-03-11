import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Chat from './components/Chat';

function App() {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGuestLogin = () => {
    setIsGuest(true);
    sessionStorage.setItem('guestUser', 'true');
  };

  const handleGuestLogout = () => {
    setIsGuest(false);
    sessionStorage.removeItem('guestUser');
  };

  const isAuthenticated = !!user || isGuest;

  const activeUser = user || (isGuest ? {
    displayName: 'Guest User',
    photoURL: null,
    email: 'guest@local',
    isGuest: true,
  } : null);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(99,102,241,0.2)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
          Loading NexusAI...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/chat' : '/login'} replace />}
        />
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/chat" replace />
              : <Login onGuestLogin={handleGuestLogin} />
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated
              ? <Chat user={activeUser} onGuestLogout={handleGuestLogout} />
              : <Navigate to="/login" replace />
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
