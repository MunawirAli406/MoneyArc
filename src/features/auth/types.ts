export interface User {
    id: string;
    email: string;
    name?: string;
    password?: string;
    provider?: 'Google' | 'Microsoft' | 'Local';
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    signup: (email: string, name: string, password?: string) => Promise<void>;
    loginWithSocial: (email: string, name: string, provider: 'Google' | 'Microsoft') => Promise<void>;
    logout: () => void;
}

export const AUTH_KEY = 'moneyarc_auth_user';
