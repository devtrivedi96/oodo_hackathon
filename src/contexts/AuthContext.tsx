import { createContext, useContext, useEffect, useState } from "react";
import { authAPI, Profile, UserRole } from "../lib/db";

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("auth_token");
    const userId = localStorage.getItem("user_id");
    const userEmail = localStorage.getItem("user_email");

    if (token && userId && userEmail) {
      setUser({ id: userId, email: userEmail });
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadProfile() {
    try {
      const data = await authAPI.getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { token, user: userData } = await authAPI.signIn(email, password);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_id", userData.id);
      localStorage.setItem("user_email", userData.email);
      setUser({ id: userData.id, email: userData.email });
      await loadProfile();
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ) {
    try {
      const { token, user: userData } = await authAPI.signUp(
        email,
        password,
        fullName,
        role,
      );
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_id", userData.id);
      localStorage.setItem("user_email", userData.email);
      setUser({ id: userData.id, email: userData.email });
      setProfile(userData);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  }

  async function signOut() {
    try {
      await authAPI.signOut();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_email");
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  function hasRole(role: UserRole): boolean {
    return profile?.role === role;
  }

  function hasAnyRole(roles: UserRole[]): boolean {
    return profile ? roles.includes(profile.role) : false;
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
