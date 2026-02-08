import { useEffect, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './useTheme';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { BUSINESS_THEMES } from './businessThemes';

/*
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}
*/

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('moneyarc_theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const { activeCompany } = usePersistence();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('moneyarc_theme', theme);

        // Inject Business Theme
        if (activeCompany?.businessType) {
            const bTheme = BUSINESS_THEMES[activeCompany.businessType];
            if (bTheme) {
                // Only change company-specific variable, keep platform Teal standard
                root.style.setProperty('--company-primary', bTheme.primary);

                // Keep platform theme consistent
                root.style.setProperty('--primary', '173 80% 40%');
                root.style.setProperty('--background', theme === 'dark' ? '222 47% 11%' : '0 0% 96%');
                root.style.setProperty('--card', theme === 'dark' ? '222 47% 13%' : '0 0% 100%');
                root.style.setProperty('--accent', theme === 'dark' ? '173 80% 20%' : '173 80% 95%');
            }
        } else {
            // Reset to defaults
            root.style.setProperty('--primary', '173 80% 40%');
            root.style.setProperty('--company-primary', '173 80% 40%');
            root.style.setProperty('--background', theme === 'dark' ? '222 47% 11%' : '0 0% 96%');
            root.style.setProperty('--card', theme === 'dark' ? '222 47% 13%' : '0 0% 100%');
            root.style.setProperty('--accent', theme === 'dark' ? '173 80% 20%' : '173 80% 95%');
        }

        root.style.transition = 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }, [theme, activeCompany]);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}


// Moved to useTheme.ts
