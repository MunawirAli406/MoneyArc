import type { StorageProvider } from './types';

export class FileSystemProvider implements StorageProvider {
    private dirHandle: FileSystemDirectoryHandle | null = null;

    public get isReady(): boolean {
        return this.dirHandle !== null;
    }

    async init(): Promise<void> {
        try {
            if ('showDirectoryPicker' in window) {
                // Explicitly cast window to any to avoid type check errors if global augmentation fails or is missing
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

    async read<T>(filename: string): Promise<T | null> {
        if (!this.dirHandle) throw new Error('Storage not initialized');

        try {
            const fileHandle = await this.dirHandle.getFileHandle(filename, { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text) as T;
        } catch (err) {
            // If file doesn't exist, return null
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((err as any).name === 'NotFoundError') {
                return null;
            }
            throw err;
        }
    }

    async write<T>(filename: string, data: T): Promise<void> {
        if (!this.dirHandle) throw new Error('Storage not initialized');

        try {
            const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
        } catch (err) {
            console.error('Error writing file:', err);
            throw err;
        }
    }
}
