import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { StorageProvider, StorageType, Company } from './types';
import { FileSystemProvider } from './FileSystemProvider';

interface PersistenceContextType {
    provider: StorageProvider | null;
    storageType: StorageType;
    activeCompany: Company | null;
    initializeStorage: (type: StorageType) => Promise<void>;
    restoreStorage: () => Promise<boolean>;
    selectCompany: (company: Company | null) => void;
}

const PersistenceContext = createContext<PersistenceContextType | null>(null);

export function PersistenceProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<StorageProvider | null>(null);
    const [storageType, setStorageType] = useState<StorageType>(null);
    const [activeCompany, setActiveCompany] = useState<Company | null>(null);

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
        } catch (e) {
            console.error('PersistenceProvider: Restore failed', e);
        }
        console.log('PersistenceProvider: Storage not restored (normal if first run).');
        return false;
    };

    const initializeStorage = async (type: StorageType) => {
        let newProvider: StorageProvider | null = null;

        if (type === 'local') {
            newProvider = new FileSystemProvider();
        } else if (type === 'browser') {
            const { LocalStorageProvider } = await import('./LocalStorageProvider');
            newProvider = new LocalStorageProvider();
        }
        // Add Cloud provider logic here later

        if (newProvider) {
            await newProvider.init();
            if (newProvider.isReady) {
                setProvider(newProvider);
                setStorageType(type);
            }
        }
    };

    const selectCompany = (company: Company | null) => {
        setActiveCompany(company);
    };

    return (
        <PersistenceContext.Provider value={{
            provider,
            storageType,
            activeCompany,
            initializeStorage,
            restoreStorage,
            selectCompany
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
