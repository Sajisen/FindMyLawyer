import { useEffect, useState } from "react";

import AuthContext from "./authContext.js";
import { apiRequest } from "../services/api.js";

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


  async function updateAccount(details) {
    if (!token) {
      throw new Error("You need to sign in first.");
    }

    const data = await apiRequest("/auth/me", {
      method: "PATCH",
      token,
      body: details,
    });

    setUser(data.user);
    return data.user;
  }


  function acceptSecuritySession(data) {
    if (!data?.token || !data?.user) {
      throw new Error("The server did not return a valid updated session.");
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function requestEmailChange(details) {
    if (!token) throw new Error("You need to sign in first.");

    return apiRequest("/auth/me/email-change/request", {
      method: "POST",
      token,
      body: details,
    });
  }

  async function verifyEmailChange(details) {
    if (!token) throw new Error("You need to sign in first.");

    const data = await apiRequest("/auth/me/email-change/verify", {
      method: "POST",
      token,
      body: details,
    });
    acceptSecuritySession(data);
    return data;
  }

  async function changePassword(details) {
    if (!token) throw new Error("You need to sign in first.");

    const data = await apiRequest("/auth/me/password/change", {
      method: "POST",
      token,
      body: details,
    });
    acceptSecuritySession(data);
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
        updateAccount,
        requestEmailChange,
        verifyEmailChange,
        changePassword,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

