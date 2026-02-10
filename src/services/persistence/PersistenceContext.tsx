import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { StorageProvider, StorageType, Company } from './types';
import { FileSystemProvider } from './FileSystemProvider';
import { GitHubProvider } from './GitHubProvider';
import { LedgerService } from '../accounting/LedgerService';
import { useNotifications } from '../notifications/NotificationContext';

interface PersistenceContextType {
    provider: StorageProvider | null;
    storageType: StorageType;
    activeCompany: Company | null;
    isSyncing: boolean;
    isInitialized: boolean;
    initializeStorage: (type: StorageType, config?: any) => Promise<void>;
    restoreStorage: () => Promise<boolean>;
    selectCompany: (company: Company | null) => Promise<void>;
    sync: () => Promise<void>;
}

const PersistenceContext = createContext<PersistenceContextType | null>(null);

export function PersistenceProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<StorageProvider | null>(null);
    const [storageType, setStorageType] = useState<StorageType>(null);
    const [activeCompany, setActiveCompany] = useState<Company | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { addNotification } = useNotifications();

    const restoreStorage = async () => {
        console.log('[Persistence] Starting restoration sequence...');
        try {
            // Priority 1: Check Local Storage/IDB
            const localProvider = new FileSystemProvider();
            const restored = await localProvider.restore?.();

            if (restored) {
                console.log('[Persistence] Local storage handle restored.');
                setProvider(localProvider);
                setStorageType('local');

                const savedCompany = localStorage.getItem('moneyarc_active_company');
                if (savedCompany) {
                    try {
                        const company: Company = JSON.parse(savedCompany);
                        setActiveCompany(company);
                        console.log('[Persistence] Restored active company:', company.name);

                        // Run sanity check in background
                        LedgerService.ensureDataSanity(localProvider, company).catch(err => {
                            console.error('[Persistence] Sanity check failed:', err);
                        });
                    } catch (e) {
                        console.error('[Persistence] Failed to parse saved company', e);
                    }
                }
                return true;
            }

            // Priority 2: Check Cloud (GitHub)
            const githubProvider = new GitHubProvider();
            const ghRestored = await githubProvider.restore?.();
            if (ghRestored) {
                console.log('[Persistence] GitHub storage restored.');
                setProvider(githubProvider);
                setStorageType('github');

                const savedCompany = localStorage.getItem('moneyarc_active_company');
                if (savedCompany) {
                    try {
                        const company: Company = JSON.parse(savedCompany);
                        setActiveCompany(company);
                        LedgerService.ensureDataSanity(githubProvider, company).catch(e => console.error(e));
                    } catch (e) {
                        console.error(e);
                    }
                }
                return true;
            }
        } catch (error) {
            console.error('[Persistence] Critical error during storage restoration:', error);
        } finally {
            console.log('[Persistence] Initialization complete.');
            setIsInitialized(true);
        }
        return false;
    };

    // Try to restore storage on mount
    useEffect(() => {
        restoreStorage();
    }, []);

    const initializeStorage = async (type: StorageType, config?: any) => {
        let newProvider: StorageProvider | null = null;
        if (type === 'local') {
            newProvider = new FileSystemProvider();
        } else if (type === 'github') {
            newProvider = new GitHubProvider();
        }

        if (newProvider) {
            await newProvider.init(config);
            if (newProvider.isReady) {
                setProvider(newProvider);
                setStorageType(type);
            }
        }
    };

    const selectCompany = async (company: Company | null) => {
        setActiveCompany(company);
        if (company) {
            localStorage.setItem('moneyarc_active_company', JSON.stringify(company));
            if (provider) {
                await LedgerService.ensureDataSanity(provider, company);
            }
        } else {
            localStorage.removeItem('moneyarc_active_company');
        }
    };

    const sync = async () => {
        if (!provider || !provider.sync) return;
        setIsSyncing(true);
        try {
            await provider.sync();
            addNotification({
                title: 'Data Synced',
                message: 'Successfully updated from GitHub',
                type: 'success'
            });
        } catch (e) {
            addNotification({
                title: 'Sync Failed',
                message: (e as Error).message,
                type: 'error'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <PersistenceContext.Provider value={{
            provider,
            storageType,
            activeCompany,
            isSyncing,
            isInitialized,
            initializeStorage,
            restoreStorage,
            selectCompany,
            sync
        }}>
            {children}
        </PersistenceContext.Provider>
    );
}

export function usePersistence() {
    const context = useContext(PersistenceContext);
    if (!context) {
        throw new Error('usePersistence must be used within a PersistenceProvider');
    }
    return context;
}
