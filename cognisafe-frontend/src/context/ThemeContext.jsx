import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem("cog_dark");
        return saved === "true";
    });

    useEffect(() => {
        localStorage.setItem("cog_dark", dark);
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    }, [dark]);

    const toggleTheme = () => setDark(prev => !prev);

    return (
        <ThemeContext.Provider value={{ dark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
};