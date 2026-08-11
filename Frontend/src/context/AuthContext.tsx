import React, { createContext, useContext, useState, useEffect } from "react";
import { User, LoginInput, SignupInput } from "../types";
import { loginUser, signupUser } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("ticketdesk_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("ticketdesk_token");
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("ticketdesk_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ticketdesk_user");
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("ticketdesk_token", token);
    } else {
      localStorage.removeItem("ticketdesk_token");
    }
  }, [token]);

  const login = async (data: LoginInput) => {
    const res = await loginUser(data);
    setUser(res.user);
    setToken(res.access_token);
  };

  const signup = async (data: SignupInput) => {
    const res = await signupUser(data);
    setUser(res.user);
    setToken(res.access_token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("ticketdesk_user");
    localStorage.removeItem("ticketdesk_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
