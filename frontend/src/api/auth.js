const API_BASE = '/api';

export function clearAuthSession() {
  localStorage.removeItem('blitz_token');
  localStorage.removeItem('blitz_user');
}

export function notifyAuthExpired() {
  window.dispatchEvent(new CustomEvent('blitz:auth_expired'));
}

export async function loginUser(identifier, password) {
  const payload = {
    email: identifier.includes('@') ? identifier.trim() : '',
    username: !identifier.includes('@') ? identifier.trim() : identifier.trim(),
    password,
  };

  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data.detail ||
      (data.non_field_errors && data.non_field_errors[0]) ||
      'Invalid email or password. Please try again.';
    throw new Error(errorMsg);
  }

  // Persist session
  if (data.token) {
    localStorage.setItem('blitz_token', data.token);
    localStorage.setItem('blitz_user', JSON.stringify(data.user));
  }

  return data;
}

export async function logoutUser() {
  const token = localStorage.getItem('blitz_token');
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  clearAuthSession();
}

export function getStoredUser() {
  try {
    const userStr = localStorage.getItem('blitz_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem('blitz_token');
}

/**
 * Validates the current stored token against the server to check if it has expired.
 * If expired or invalid (401), clears session and notifies listener to redirect to login.
 */
export async function checkTokenValidity() {
  const token = getStoredToken();
  if (!token) {
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/me/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });

    if (res.status === 401) {
      clearAuthSession();
      notifyAuthExpired();
      return false;
    }

    if (!res.ok) {
      return false;
    }

    const data = await res.json().catch(() => ({}));
    if (data.user) {
      localStorage.setItem('blitz_user', JSON.stringify(data.user));
    }
    return true;
  } catch {
    // Network glitch or server temporarily unreachable; keep local state
    return true;
  }
}
