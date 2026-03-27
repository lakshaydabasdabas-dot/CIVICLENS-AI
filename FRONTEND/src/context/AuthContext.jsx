import { createContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredAuth,
  fetchCurrentAdmin,
  getStoredAuth,
  loginAdmin,
} from "../services/authService.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => getStoredAuth());
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const validate = async () => {
      const stored = getStoredAuth();

      if (!stored?.access_token) {
        setAuthState(null);
        setCurrentUser(null);
        setIsCheckingAuth(false);
        return;
      }

      try {
        const profile = await fetchCurrentAdmin(stored.access_token);
        setAuthState(stored);
        setCurrentUser(profile);
      } catch (error) {
        console.error(error);
        clearStoredAuth();
        setAuthState(null);
        setCurrentUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void validate();
  }, []);

  const login = async (username, password) => {
    const payload = await loginAdmin(username, password);
    setAuthState(payload);
    setCurrentUser(payload.user);
    return payload;
  };

  const logout = () => {
    clearStoredAuth();
    setAuthState(null);
    setCurrentUser(null);
  };

  const authToken = authState?.access_token || null;

  const value = useMemo(
    () => ({
      authState,
      authToken,
      currentUser,
      isAuthenticated: Boolean(authToken),
      isCheckingAuth,
      login,
      logout,
    }),
    [authState, authToken, currentUser, isCheckingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}