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
        console.log(`[Auth] Attempting login for: ${email}`);
        try {
            await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, 600); });
            const users = await getUsers();
            console.log(`[Auth] Retrieved ${users.length} total users.`);

            const foundUser = users.find((u) => u.email === email && (!password || u.password === password));

            if (foundUser) {
                console.log(`[Auth] Login successful for: ${email}`);
                const userSafe = { ...foundUser, provider: 'Local' as const };
                delete userSafe.password;
                setUser(userSafe as User);
                AuditService.setCurrentUser({ ...userSafe, name: userSafe.name || 'User' });
                localStorage.setItem(AUTH_KEY, JSON.stringify(userSafe));
            } else {
                console.warn(`[Auth] Login failed: User not found or invalid credentials for ${email}`);
                throw new Error('Invalid credentials or user not found. Please ensure you have selected the correct data source.');
            }
        } catch (err) {
            console.error('[Auth] Login error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email: string, name: string, password?: string) => {
        setIsLoading(true);
        console.log(`[Auth] Attempting signup for: ${email} (${name})`);
        try {
            await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, 800); });
            const users = await getUsers();

            if (users.find((u) => u.email === email)) {
                console.warn(`[Auth] Signup failed: User ${email} already exists.`);
                throw new Error('User already exists in this directory.');
            }

            const newUser = { id: Math.random().toString(36).substr(2, 9), email, name, password, provider: 'Local' as const };
            const updatedUsers = [...users, newUser];
            await saveUsers(updatedUsers);
            console.log(`[Auth] Signup successful: ${email}`);

            const userSafe = { ...newUser } as User;
            delete userSafe.password;
            setUser(userSafe);
            AuditService.setCurrentUser({ ...userSafe, name: userSafe.name || 'User' });
            localStorage.setItem(AUTH_KEY, JSON.stringify(userSafe));
        } catch (err) {
            console.error('[Auth] Signup error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithSocial = async (email: string, name: string, socialProvider: 'Google' | 'Microsoft') => {
        setIsLoading(true);
        console.log(`[Auth] Social Login starting (${socialProvider}) for: ${email}`);
        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const users = await getUsers();
            let foundUser = users.find((u) => u.email === email);

            if (!foundUser) {
                console.log(`[Auth] Social Login: New user detected, auto-registering: ${email}`);
                const newUser = { id: Math.random().toString(36).substr(2, 9), email, name, provider: socialProvider };
                await saveUsers([...users, newUser]);
                foundUser = newUser;
            }

            const userSafe = { ...foundUser, provider: socialProvider };
            delete userSafe.password;
            setUser(userSafe as User);
            AuditService.setCurrentUser({ ...userSafe, name: userSafe.name || 'User' });
            localStorage.setItem(AUTH_KEY, JSON.stringify(userSafe));
            console.log(`[Auth] Social Login (${socialProvider}) success for ${email}`);
        } catch (err) {
            console.error(`[Auth] Social Login (${socialProvider}) error:`, err);
            throw err;
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
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, loginWithSocial, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


// useAuth moved to AuthContext.provider.tsx
