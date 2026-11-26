import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, loginRequest, registerRequest } from '../api/auth';
import { clearAuth, getStoredUser, getToken, saveAuth } from '../utils/storage';

const AuthContext = createContext(null);

/**
 * Holds the logged-in user for the whole app.
 *
 * - token + user are saved in localStorage so a page refresh keeps you logged in
 * - on first load we call GET /auth/me to make sure the saved token is still valid
 *   (if it is not, the axios interceptor clears it and sends you to /login)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [checking, setChecking] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;
    fetchMe()
      .then((freshUser) => {
        if (cancelled) return;
        setUser(freshUser);
        saveAuth(null, freshUser);
      })
      .catch((error) => {
        if (cancelled) return;
        // 401 -> the token is bad. Any other error (e.g. server down) -> keep the saved user.
        if (error.response?.status === 401) {
          clearAuth();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await loginRequest(email, password);
    saveAuth(token, loggedInUser);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (details) => {
    const { token, user: newUser } = await registerRequest(details);
    saveAuth(token, newUser);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === 'admin',
      checking,
      login,
      register,
      logout,
    }),
    [user, checking, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
