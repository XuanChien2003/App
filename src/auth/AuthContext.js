import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, setToken as persistToken, setUnauthorizedHandler } from '../api/client';
import { login as loginApi } from '../api/auth';

const USER_KEY = 'nxc_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      const [storedToken, storedUserRaw] = await Promise.all([getToken(), AsyncStorage.getItem(USER_KEY)]);
      if (storedToken) setTokenState(storedToken);
      if (storedUserRaw) {
        try {
          setUser(JSON.parse(storedUserRaw));
        } catch {
          // ignore corrupt cache
        }
      }
      setInitializing(false);
    })();
  }, []);

  const logout = useCallback(async () => {
    await persistToken(null);
    await AsyncStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  const login = useCallback(async (username, password) => {
    const result = await loginApi(username, password);
    // App PDA is scanner-only (PROJECT_CONTEXT.md section 1) - admin/partner belong on Web Admin.
    if (result.user.role !== 'scanner') {
      throw new Error('Tài khoản này vui lòng đăng nhập trên Web Admin, không dùng App quét mã.');
    }
    await persistToken(result.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setTokenState(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!token, initializing, login, logout }),
    [user, token, initializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
