import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, provider } from '../firebase';

const Login = ({ onGuestLogin }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const syncUser = async (firebaseUser) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    try {
      await fetch(`${baseUrl}/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || name.trim() || 'User',
          photoURL: firebaseUser.photoURL,
        }),
      });
    } catch (err) {
      console.error('Failed to sync user with backend:', err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      await syncUser(result.user);
      navigate('/chat');
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please try Email sign-in or Guest access.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled. Please try Email or Guest access.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Google sign-in failed. Try Email login or Guest access below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
        await syncUser(userCredential.user);
        setSuccess('Account created! Redirecting...');
        setTimeout(() => navigate('/chat'), 1000);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await syncUser(userCredential.user);
        navigate('/chat');
      }
    } catch (err) {
      console.error('Email auth error:', err);
      const errorMap = {
        'auth/user-not-found': 'No account found with this email. Please sign up.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'This email is already registered. Please log in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
        'auth/too-many-requests': 'Too many failed attempts. Please wait and try again.',
        'auth/invalid-credential': 'Invalid email or password. Please try again.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
      };
      setError(errorMap[err.code] || `Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    if (onGuestLogin) onGuestLogin();
    navigate('/chat');
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  return (
    <div style={styles.page}>
      {/* Animated background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      <div style={styles.container}>
        {/* Left panel - Branding */}
        <div style={styles.leftPanel}>
          <div style={styles.brandLogo}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="rgba(99,102,241,0.2)" />
              <path d="M12 20C12 20 14 14 20 14C26 14 28 20 28 20C28 20 26 26 20 26C14 26 12 20 12 20Z" stroke="#818cf8" strokeWidth="2" fill="none"/>
              <circle cx="20" cy="20" r="4" fill="#6366f1"/>
            </svg>
            <span style={styles.brandName}>NexusAI</span>
          </div>
          <h1 style={styles.heroTitle}>
            Chat with AI,<br />
            <span style={styles.heroAccent}>Unleash Possibilities</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Powered by GPT-4 intelligence. Ask anything, get instant smart responses.
          </p>
          <div style={styles.features}>
            {['Fast AI responses', 'Secure & Private', 'Dark mode interface', 'Responsive design'].map((f, i) => (
              <div key={i} style={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>

        {/* Right panel - Auth Form */}
        <div style={styles.rightPanel}>
          <div style={styles.tabRow}>
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              style={mode === 'login' ? styles.tabActive : styles.tabInactive}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              style={mode === 'signup' ? styles.tabActive : styles.tabInactive}
            >
              Sign Up
            </button>
          </div>

          <h2 style={styles.formTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p style={styles.formSubtitle}>
            {mode === 'login' ? 'Sign in to continue' : 'Join our community'}
          </p>

          {/* Error & Success Messages */}
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>!</span> {error}
            </div>
          )}
          {success && (
            <div style={styles.successBox}>
              <span>OK</span> {success}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={styles.googleBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing in...' : `Continue with Google`}
          </button>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or continue with email</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} style={styles.form}>
            {mode === 'signup' && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={{...styles.inputWrapper, ...(focusedField === 'name' ? styles.inputWrapperFocused : {})}}>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Enter your full name"
                    style={styles.input}
                    required
                  />
                </div>
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={{...styles.inputWrapper, ...(focusedField === 'email' ? styles.inputWrapperFocused : {})}}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Enter your email"
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={{...styles.inputWrapper, ...(focusedField === 'password' ? styles.inputWrapperFocused : {})}}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Enter your password'}
                  style={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Confirm Password</label>
                <div style={{...styles.inputWrapper, ...(focusedField === 'confirm' ? styles.inputWrapperFocused : {})}}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Re-enter your password"
                    style={styles.input}
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div style={styles.forgotRow}>
                <span style={styles.forgotText}>Forgot your password?</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={styles.submitBtn}
              onMouseEnter={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {isLoading ? (
                <span style={styles.spinner} />
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Guest Login */}
          <button
            onClick={handleGuestLogin}
            style={styles.guestBtn}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
          >
            Continue as Guest
          </button>

          <p style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={toggleMode} style={styles.switchLink}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  orb1: {
    position: 'absolute',
    top: '-100px',
    left: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    bottom: '-100px',
    right: '-100px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    display: 'flex',
    width: '100%',
    maxWidth: '950px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
    position: 'relative',
    zIndex: 1,
  },
  leftPanel: {
    flex: 1,
    padding: '48px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandName: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#fff',
    lineHeight: 1.2,
    margin: 0,
    marginTop: '8px',
  },
  heroAccent: {
    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '16px',
    lineHeight: 1.6,
    margin: 0,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
  },
  featureItem: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  rightPanel: {
    flex: 1,
    padding: '48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tabRow: {
    display: 'flex',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
  },
  tabActive: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '9px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabInactive: {
    flex: 1,
    padding: '10px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    border: 'none',
    borderRadius: '9px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    margin: '0',
    marginTop: '4px',
  },
  formSubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '14px',
    margin: 0,
  },
  errorBox: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#fca5a5',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: { fontSize: '16px' },
  successBox: {
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#86efac',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  googleBtn: {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '13px',
    fontWeight: '500',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '0 14px',
    transition: 'all 0.2s',
  },
  inputWrapperFocused: {
    border: '1px solid #6366f1',
    background: 'rgba(99,102,241,0.08)',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
  },
  inputIcon: {
    fontSize: '16px',
    marginRight: '10px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: '15px',
    padding: '13px 0',
    fontFamily: 'inherit',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    flexShrink: 0,
  },
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '-6px',
  },
  forgotText: {
    color: '#6366f1',
    fontSize: '13px',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
    marginTop: '4px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  guestBtn: {
    width: '100%',
    padding: '13px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  switchText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    margin: '4px 0 0',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

// Inject keyframe animation
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  input::placeholder { color: rgba(255,255,255,0.25) !important; }
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px rgba(30,30,50,1) inset !important;
    -webkit-text-fill-color: #fff !important;
  }
`;
if (!document.head.querySelector('#login-styles')) {
  styleTag.id = 'login-styles';
  document.head.appendChild(styleTag);
}

export default Login;