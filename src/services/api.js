// Shared API service for communicating with the backend
const BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000';

export const sendChatMessage = async (message) => {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json(); // { reply: string }
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/`);
    return await res.json();
  } catch {
    return null;
  }
};
