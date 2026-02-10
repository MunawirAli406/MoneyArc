import { get, set, keys, del } from 'idb-keyval';
import type { StorageProvider, Company } from './types';

const HANDLE_KEY = 'moneyarc_dir_handle';
const VIRTUAL_FS_PREFIX = 'moneyarc_vfs_';

export class FileSystemProvider implements StorageProvider {
    private dirHandle: FileSystemDirectoryHandle | null = null;
    private isVirtual = false;
    public readonly: boolean = false;

    public get isReady(): boolean {
        return this.dirHandle !== null || this.isVirtual;
    }

    async init(): Promise<void> {
        try {
            if ('showDirectoryPicker' in window) {
                // Desktop: Try Native File System
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.dirHandle = await (window as any).showDirectoryPicker({
                    mode: 'readwrite',
                    startIn: 'documents',
                });

                // Persist the handle for next session
                if (this.dirHandle) {
                    await set(HANDLE_KEY, this.dirHandle);
                    this.isVirtual = false;
                }
            } else {
                // Mobile/Unsupported: Use Virtual File System (IDB)
                console.warn("File System Access API not supported. Using Virtual File System (IndexedDB).");
                this.isVirtual = true;
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Error selecting directory:', err);
                throw err;
            }
        }
    }

    async restore(): Promise<boolean> {
        try {
            if ('showDirectoryPicker' in window) {
                const savedHandle = await get<FileSystemDirectoryHandle>(HANDLE_KEY);
                if (savedHandle) {
                    // Verify permissions
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const options = { mode: 'readwrite' };
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (await (savedHandle as any).queryPermission(options) === 'granted') {
                        this.dirHandle = savedHandle;
                        this.isVirtual = false;
                        return true;
                    }
                }
            } else {
                // Mobile: Always "persisted" as it uses IDB
                this.isVirtual = true;
                return true;
            }
        } catch (err) {
            console.warn('Failed to restore directory handle:', err);
        }
        return false;
    }

    async listCompanies(): Promise<Company[]> {
        if (!this.isReady) throw new Error('Storage not initialized');
        const companies: Company[] = [];

        if (this.isVirtual) {
            console.log('FileSystemProvider: Listing companies from Virtual FS');
            // Virtual FS: Scan IDB keys for company.json files
            // Format: moneyarc_vfs_{companyPath}_company.json
            const allKeys = await keys();
            console.log('FileSystemProvider: Found IDB keys:', allKeys);
            for (const key of allKeys) {
                if (typeof key === 'string' && key.startsWith(VIRTUAL_FS_PREFIX) && key.endsWith('company.json')) {
                    try {
                        const data = await get(key);
                        if (data) {
                            // Extract path from key: moneyarc_vfs_path_to_company_company.json
                            // But simpler: store path in the object itself
                            const company = typeof data === 'string' ? JSON.parse(data) : data;
                            companies.push(company);
                        }
                    } catch (e) {
                        console.error('Failed to parse virtual company', e);
                    }
                }
            }
            console.log('FileSystemProvider: Parsed companies:', companies);
        } else {
            // Native FS
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for await (const entry of (this.dirHandle as any).values()) {
                if (entry.kind === 'directory') {
                    try {
                        const compFile = await entry.getFileHandle('company.json');
                        const file = await compFile.getFile();
                        const text = await file.text();
                        const data = JSON.parse(text);
                        companies.push({
                            ...data,
                            path: entry.name
                        });
                    } catch {
                        // Skip
                    }
                }
            }
        }
        return companies;
    }

    async createCompany(data: Omit<Company, 'id' | 'path'>): Promise<Company> {
        if (!this.isReady) throw new Error('Storage not initialized');

        const id = Math.random().toString(36).substr(2, 9);
        const folderName = `${data.name.replace(/\s+/g, '_')}_${id}`;

        const companyData: Company = {
            id,
            ...data,
            path: folderName
        };

        if (this.isVirtual) {
            console.log('FileSystemProvider: Creating company in Virtual FS:', companyData);
            // Virtual FS: Write to IDB
            const key = `${VIRTUAL_FS_PREFIX}${folderName}_company.json`;
            await set(key, JSON.stringify(companyData, null, 2));
            console.log('FileSystemProvider: Company saved to IDB key:', key);
        } else {
            // Native FS
            if (!this.dirHandle) throw new Error("Native handle missing");
            const companyDir = await this.dirHandle.getDirectoryHandle(folderName, { create: true });
            const compFile = await companyDir.getFileHandle('company.json', { create: true });
            const writable = await compFile.createWritable();
            await writable.write(JSON.stringify(companyData, null, 2));
            await writable.close();
        }

        return companyData;
    }

    async updateCompany(id: string, path: string, data: Partial<Omit<Company, 'id' | 'path'>>): Promise<Company> {
        if (!this.isReady) throw new Error('Storage not initialized');

        // Read existing first to merge
        let existingData: Company;

        if (this.isVirtual) {
            const key = `${VIRTUAL_FS_PREFIX}${path}_company.json`;
            const content = await get(key);
            existingData = typeof content === 'string' ? JSON.parse(content) : content;
        } else {
            if (!this.dirHandle) throw new Error("Native handle missing");
            const companyDir = await this.dirHandle.getDirectoryHandle(path);
            const compFile = await companyDir.getFileHandle('company.json');
            const file = await compFile.getFile();
            const text = await file.text();
            existingData = JSON.parse(text);
        }

        const updatedData: Company = {
            ...existingData,
            ...data,
            id,
            path
        };

        if (this.isVirtual) {
            const key = `${VIRTUAL_FS_PREFIX}${path}_company.json`;
            await set(key, JSON.stringify(updatedData, null, 2));
        } else {
            // Native Write
            if (!this.dirHandle) throw new Error("Native handle missing");
            const companyDir = await this.dirHandle.getDirectoryHandle(path);
            const compFile = await companyDir.getFileHandle('company.json', { create: true });
            const writable = await compFile.createWritable();
            await writable.write(JSON.stringify(updatedData, null, 2));
            await writable.close();
        }

        return updatedData;
    }

    async deleteCompany(_id: string, path: string): Promise<void> {
        if (!this.isReady) throw new Error('Storage not initialized');

        if (this.isVirtual) {
            console.log('FileSystemProvider: Deleting company from Virtual FS:', path);
            const allKeys = await keys();
            const prefix = `${VIRTUAL_FS_PREFIX}${path}`;
            for (const key of allKeys) {
                if (typeof key === 'string' && key.startsWith(prefix)) {
                    await del(key);
                }
            }
        } else {
            // Native FS
            if (!this.dirHandle) throw new Error("Native handle missing");
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (this.dirHandle as any).removeEntry(path, { recursive: true });
            } catch (err) {
                console.error('Error deleting company directory:', err);
                throw err;
            }
        }
    }

    async read<T>(filename: string, companyPath?: string): Promise<T | null> {
        if (!this.isReady) throw new Error('Storage not initialized');

        if (this.isVirtual) {
            // Virtual FS key: prefix + companyPath + filename
            // If companyPath is missing (root file?), handling might differ, but app mostly reads company data
            const key = `${VIRTUAL_FS_PREFIX}${companyPath ? companyPath + '_' : ''}${filename}`;
            const data = await get(key);
            if (!data) return null;
            return typeof data === 'string' ? JSON.parse(data) : data as T;
        } else {
            // Native FS
            try {
                if (!this.dirHandle) throw new Error("Native handle missing");
                let targetDir = this.dirHandle;
                if (companyPath) {
                    targetDir = await this.dirHandle.getDirectoryHandle(companyPath);
                }

                const fileHandle = await targetDir.getFileHandle(filename, { create: false });
                const file = await fileHandle.getFile();
                const text = await file.text();
                return JSON.parse(text) as T;
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((err as any).name === 'NotFoundError') {
                    return null;
                }
                throw err;
            }
        }
    }

    async write<T>(filename: string, data: T, companyPath?: string): Promise<void> {
        if (!this.isReady) throw new Error('Storage not initialized');

        if (this.isVirtual) {
            const key = `${VIRTUAL_FS_PREFIX}${companyPath ? companyPath + '_' : ''}${filename}`;
            await set(key, JSON.stringify(data, null, 2));
        } else {
            // Native FS
            try {
                if (!this.dirHandle) throw new Error("Native handle missing");
                let targetDir = this.dirHandle;
                if (companyPath) {
                    targetDir = await this.dirHandle.getDirectoryHandle(companyPath, { create: true });
                }

                const fileHandle = await targetDir.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(data, null, 2));
                await writable.close();
            } catch (err) {
                console.error('Error writing file:', err);
                throw err;
            }
        }
    }
}
