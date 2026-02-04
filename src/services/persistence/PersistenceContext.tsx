import { createContext, useContext, useState, type ReactNode } from 'react';
import type { StorageProvider, StorageType } from './types';
import { FileSystemProvider } from './FileSystemProvider';

interface PersistenceContextType {
    provider: StorageProvider | null;
    storageType: StorageType;
    initializeStorage: (type: StorageType) => Promise<void>;
}

const PersistenceContext = createContext<PersistenceContextType | null>(null);

export function PersistenceProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<StorageProvider | null>(null);
    const [storageType, setStorageType] = useState<StorageType>(null);

    const initializeStorage = async (type: StorageType) => {
        let newProvider: StorageProvider | null = null;

        if (type === 'local') {
            newProvider = new FileSystemProvider();
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

    return (
        <PersistenceContext.Provider value={{ provider, storageType, initializeStorage }}>
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
