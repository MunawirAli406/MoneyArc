import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { usePersistence } from '../../services/persistence/PersistenceContext';

interface User {
    id: string;
    email: string;
    name?: string;
    password?: string; // Stored for local validation
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    signup: (email: string, name: string, password?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = 'moneyarc_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { provider } = usePersistence();

    useEffect(() => {
        console.log('AuthProvider: Initializing...');
        try {
            const savedUser = localStorage.getItem(AUTH_KEY);
            if (savedUser) {
                console.log('AuthProvider: User found in localStorage.');
                setUser(JSON.parse(savedUser));
            } else {
                console.log('AuthProvider: No user in localStorage.');
            }
        } catch (e) {
            console.warn("Failed to parse auth user", e);
            localStorage.removeItem(AUTH_KEY);
        }
        setIsLoading(false);
    }, []);

    const getUsers = async (): Promise<User[]> => {
        if (!provider) return JSON.parse(localStorage.getItem('moneyarc_fallback_users') || '[]');
        return await provider.read<User[]>('users.json') || [];
    };

    const saveUsers = async (users: User[]) => {
        if (!provider) {
            localStorage.setItem('moneyarc_fallback_users', JSON.stringify(users));
            return;
        }
        await provider.write('users.json', users);
    };

    const login = async (email: string, password?: string) => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 600)); // Smooth feel
            const users = await getUsers();
            const foundUser = users.find((u) => u.email === email && (!password || u.password === password));

            if (foundUser) {
                const { password: _password, ...userSafe } = foundUser;
                setUser(userSafe as User);
                localStorage.setItem(AUTH_KEY, JSON.stringify(userSafe));
            } else {
                throw new Error('Invalid credentials or user not found in this directory.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email: string, name: string, password?: string) => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const users = await getUsers();

            if (users.find((u) => u.email === email)) {
                throw new Error('User already exists in this directory.');
            }

            const newUser = { id: Math.random().toString(36).substr(2, 9), email, name, password };
            const updatedUsers = [...users, newUser];
            await saveUsers(updatedUsers);

            const { password: _password, ...userSafe } = newUser;
            setUser(userSafe as User);
            localStorage.setItem(AUTH_KEY, JSON.stringify(userSafe));
        } finally {
            setIsLoading(false);
        }
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
