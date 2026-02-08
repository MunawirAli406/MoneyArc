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

    // Try to restore storage on mount
    useEffect(() => {
        console.log('PersistenceProvider: Attempting to restore storage...');
        restoreStorage();
    }, []);

    const restoreStorage = async () => {
        try {
            const localProvider = new FileSystemProvider();
            const restored = await localProvider.restore?.();
            if (restored) {
                console.log('PersistenceProvider: Storage restored successfully.');
                setProvider(localProvider);
                setStorageType('local');
                return true;
            }
            const githubProvider = new GitHubProvider();
            const ghRestored = await githubProvider.restore?.();
            if (ghRestored) {
                console.log('PersistenceProvider: GitHub storage restored.');
                setProvider(githubProvider);
                setStorageType('github');
                return true;
            }
        } catch (e) {
            console.error('PersistenceProvider: Restore failed', e);
        }
        console.log('PersistenceProvider: Storage not restored (normal if first run).');
        return false;
    };

    const initializeStorage = async (type: StorageType, config?: any) => {
        let newProvider: StorageProvider | null = null;

        if (type === 'local') {
            newProvider = new FileSystemProvider();
        } else if (type === 'github') {
            newProvider = new GitHubProvider();
        }
        // Add Cloud provider logic here later

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
        if (provider && company) {
            await LedgerService.ensureDataSanity(provider, company);
        }
    };

    const { addNotification } = useNotifications();

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
