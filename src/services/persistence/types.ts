export interface Company {
    id: string;
    name: string;
    financialYear: string;
    path: string; // Folder name or ID in storage
    gstin?: string;
    address?: string;
    state?: string;
    country: string;
    phone?: string;
    email?: string;
    website?: string;
    currency: string;
    symbol: string;
    registrationType?: 'Regular' | 'Composition' | 'Unregistered';
    businessType?: 'General' | 'Hotel' | 'Automobile' | 'Textiles' | 'Restaurant' | 'School' | 'Hospital' | 'Retail' | 'Manufacturing' | 'Service' | 'RealEstate' | 'Technology' | 'Logistics' | 'Agriculture';
}

export interface StorageProvider {
    /**
     * Initialize the storage (e.g., prompt for directory handle)
     */
    init(config?: any): Promise<void>;

    /**
     * List all companies in the storage
     */
    listCompanies(): Promise<Company[]>;

    /**
     * Create a new company
     */
    createCompany(data: Omit<Company, 'id' | 'path'>): Promise<Company>;

    /**
     * Update an existing company
     */
    updateCompany(id: string, path: string, data: Partial<Omit<Company, 'id' | 'path'>>): Promise<Company>;

    /**
     * Delete an existing company
     */
    deleteCompany(id: string, path: string): Promise<void>;

    /**
     * Read a file and return its content as JSON
     */
    read<T>(filename: string, companyPath?: string): Promise<T | null>;

    /**
     * Write data to a file
     */
    write<T>(filename: string, data: T, companyPath?: string): Promise<void>;

    /**
     * Optional sync method for remote providers
     */
    sync?(): Promise<void>;

    /**
     * Optional logout for cloud providers
     */
    logout?(): Promise<void>;

    /**
     * Check if storage is ready
     */
    isReady: boolean;
    readonly: boolean;
}

export type StorageType = 'local' | 'cloud' | 'browser' | 'github' | 'google-drive' | 'onedrive' | null;
