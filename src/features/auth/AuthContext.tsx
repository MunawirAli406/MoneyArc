import { useState, useEffect, type ReactNode } from 'react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { type User, AUTH_KEY } from './types';
import { AuthContext } from './AuthContext.provider';
import { AuditService } from '../../services/security/AuditService';

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
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                AuditService.setCurrentUser({ ...parsedUser, name: parsedUser.name || 'User' });
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await new Promise<void>((resolve: any) => { setTimeout(() => { resolve(); }, 600); });
            const users = await getUsers();
            const foundUser = users.find((u) => u.email === email && (!password || u.password === password));

            if (foundUser) {
                const userSafe = { ...foundUser };
                delete userSafe.password;
                setUser(userSafe as User);
                AuditService.setCurrentUser({ ...userSafe, name: userSafe.name || 'User' });
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await new Promise<void>((resolve: any) => { setTimeout(() => { resolve(); }, 800); });
            const users = await getUsers();

            if (users.find((u) => u.email === email)) {
                throw new Error('User already exists in this directory.');
            }

            const newUser = { id: Math.random().toString(36).substr(2, 9), email, name, password };
            const updatedUsers = [...users, newUser];
            await saveUsers(updatedUsers);

            const userSafe = { ...newUser } as User;
            delete userSafe.password;
            setUser(userSafe);
            AuditService.setCurrentUser({ ...userSafe, name: userSafe.name || 'User' });
            localStorage.setItem(AUTH_KEY, JSON.stringify(userSafe));
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        AuditService.setCurrentUser(null);
        localStorage.removeItem(AUTH_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


// useAuth moved to AuthContext.provider.tsx
