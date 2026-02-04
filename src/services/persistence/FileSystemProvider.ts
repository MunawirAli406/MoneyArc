import type { StorageProvider, Company } from './types';

export class FileSystemProvider implements StorageProvider {
    private dirHandle: FileSystemDirectoryHandle | null = null;

    public get isReady(): boolean {
        return this.dirHandle !== null;
    }

    async init(): Promise<void> {
        try {
            if ('showDirectoryPicker' in window) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.dirHandle = await (window as any).showDirectoryPicker({
                    mode: 'readwrite',
                    startIn: 'documents',
                });
            } else {
                console.error("File System Access API not supported");
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Error selecting directory:', err);
                throw err;
            }
        }
    }

    async listCompanies(): Promise<Company[]> {
        if (!this.dirHandle) throw new Error('Storage not initialized');
        const companies: Company[] = [];

        // In this simple implementation, each subdirectory represents a company
        // We look for a 'company.json' in each subdirectory
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
                    // Skip if not a company directory
                }
            }
        }
        return companies;
    }

    async createCompany(data: Omit<Company, 'id' | 'path'>): Promise<Company> {
        if (!this.dirHandle) throw new Error('Storage not initialized');

        const id = Math.random().toString(36).substr(2, 9);
        const folderName = `${data.name.replace(/\s+/g, '_')}_${id}`;

        // Create directory
        const companyDir = await this.dirHandle.getDirectoryHandle(folderName, { create: true });

        const companyData: Company = {
            id,
            ...data,
            path: folderName
        };

        // Write company metadata
        const compFile = await companyDir.getFileHandle('company.json', { create: true });
        const writable = await compFile.createWritable();
        await writable.write(JSON.stringify(companyData, null, 2));
        await writable.close();

        return companyData;
    }

    async read<T>(filename: string, companyPath?: string): Promise<T | null> {
        if (!this.dirHandle) throw new Error('Storage not initialized');

        try {
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

    async write<T>(filename: string, data: T, companyPath?: string): Promise<void> {
        if (!this.dirHandle) throw new Error('Storage not initialized');

        try {
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
