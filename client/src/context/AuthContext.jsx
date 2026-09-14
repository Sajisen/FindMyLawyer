import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/me", {
          token,
        });

        setUser(data.user);
      } catch (error) {
        console.error(
          "Unable to restore login:",
          error.message
        );

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, [token]);

  async function login(email, password) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    });

    localStorage.setItem("token", data.token);

    setToken(data.token);
    setUser(data.user);

    return data.user;
  }

  async function register(role, details) {
    if (!['client', 'lawyer'].includes(role)) {
      throw new Error('Invalid registration type.');
    }
    const data = await apiRequest(`/auth/register/${role}`, {
      method: 'POST',
      body: details,
    });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
