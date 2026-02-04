import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string) => Promise<void>;
    signup: (email: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = 'moneyarc_auth_user';
const USERS_KEY = 'moneyarc_registered_users';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem(AUTH_KEY);
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        const registeredUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const foundUser = registeredUsers.find((u: User) => u.email === email);

        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem(AUTH_KEY, JSON.stringify(foundUser));
        } else {
            // For demo purposes, let's allow any login but keep it realistic
            const newUser = { id: Math.random().toString(36).substr(2, 9), email };
            setUser(newUser);
            localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
        }
        setIsLoading(false);
    };

    const signup = async (email: string, name: string) => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        const newUser = { id: Math.random().toString(36).substr(2, 9), email, name };
        const registeredUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

        if (!registeredUsers.find((u: User) => u.email === email)) {
            registeredUsers.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(registeredUsers));
        }

        setUser(newUser);
        localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
        setIsLoading(false);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(AUTH_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
