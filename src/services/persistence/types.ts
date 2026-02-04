export interface StorageProvider {
    /**
     * Initialize the storage (e.g., prompt for directory handle)
     */
    init(): Promise<void>;

    /**
     * Read a file and return its content as JSON
     */
    read<T>(filename: string): Promise<T | null>;

    /**
     * Write data to a file
     */
    write<T>(filename: string, data: T): Promise<void>;

    /**
     * Check if storage is ready
     */
    isReady: boolean;
}

export type StorageType = 'local' | 'cloud' | null;
