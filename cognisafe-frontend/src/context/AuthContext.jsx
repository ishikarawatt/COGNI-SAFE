import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("cog_jwt");
      const savedUser = localStorage.getItem("cog_user");

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error restoring auth state:", error);
      // Clear corrupted data
      localStorage.removeItem("cog_jwt");
      localStorage.removeItem("cog_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (tokenData) => {
    try {
      // tokenData = { access_token, user_id, name, email }
      if (!tokenData || !tokenData.access_token) {
        throw new Error("Invalid token data");
      }

      const userData = {
        id: tokenData.user_id,
        name: tokenData.name,
        email: tokenData.email,
      };

      localStorage.setItem("cog_jwt", tokenData.access_token);
      localStorage.setItem("cog_user", JSON.stringify(userData));
      setToken(tokenData.access_token);
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("cog_jwt");
      localStorage.removeItem("cog_user");
      localStorage.removeItem("cog_last_session");
      localStorage.removeItem("cog_last_result_tier");
    } catch (error) {
      console.error("Logout error:", error);
    }
    setToken(null);
    setUser(null);
  };

  const isLoggedIn = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;