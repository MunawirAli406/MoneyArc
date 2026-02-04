export interface Company {
    id: string;
    name: string;
    financialYear: string;
    path: string; // Folder name or ID in storage
    gstin?: string;
    address?: string;
    state?: string;
    registrationType?: 'Regular' | 'Composition' | 'Unregistered';
}

export interface StorageProvider {
    /**
     * Initialize the storage (e.g., prompt for directory handle)
     */
    init(): Promise<void>;

    /**
     * List all companies in the storage
     */
    listCompanies(): Promise<Company[]>;

    /**
     * Create a new company
     */
    createCompany(data: Omit<Company, 'id' | 'path'>): Promise<Company>;

    /**
     * Read a file and return its content as JSON
     */
    read<T>(filename: string, companyPath?: string): Promise<T | null>;

    /**
     * Write data to a file
     */
    write<T>(filename: string, data: T, companyPath?: string): Promise<void>;

    /**
     * Check if storage is ready
     */
    isReady: boolean;
}

export type StorageType = 'local' | 'cloud' | null;
