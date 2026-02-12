import { get, set, del } from 'idb-keyval';
import type { StorageProvider, Company } from './types';

const DRIVE_CONFIG_KEY = 'moneyarc_google_drive_config';

export class GoogleDriveProvider implements StorageProvider {
    private config: { folderId: string; accessToken: string; expiresAt: number } | null = null;
    public readonly: boolean = false;

    public get isReady(): boolean {
        return this.config !== null && Date.now() < this.config.expiresAt;
    }

    async init(token?: string): Promise<void> {
        if (token) {
            // New login
            const expiresAt = Date.now() + 3500 * 1000;
            const folderId = await this.ensureRootFolder(token);
            this.config = { folderId, accessToken: token, expiresAt };
            await set(DRIVE_CONFIG_KEY, this.config);
        } else {
            // Restore
            const saved = await get<typeof this.config>(DRIVE_CONFIG_KEY);
            if (saved && Date.now() < saved.expiresAt) {
                this.config = saved;
            } else {
                throw new Error('Google Drive session expired or missing');
            }
        }
    }

    async restore(): Promise<boolean> {
        const saved = await get<typeof this.config>(DRIVE_CONFIG_KEY);
        if (saved && Date.now() < saved.expiresAt) {
            this.config = saved;
            return true;
        }
        return false;
    }

    async logout(): Promise<void> {
        this.config = null;
        await del(DRIVE_CONFIG_KEY);
    }

    private async fetchWithToken(url: string, options: RequestInit = {}): Promise<Response> {
        if (!this.config || Date.now() > this.config.expiresAt) {
            throw new Error('Google Drive token expired. Please reconnect.');
        }
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.config.accessToken}`
            }
        });
    }

    private async ensureRootFolder(token: string): Promise<string> {
        const query = encodeURIComponent("name = 'MoneyArc_Data' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }

        const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'MoneyArc_Data',
                mimeType: 'application/vnd.google-apps.folder'
            })
        });
        const folder = await createResp.json();
        return folder.id;
    }

    async listCompanies(): Promise<Company[]> {
        if (!this.isReady) throw new Error('Not initialized');

        const query = encodeURIComponent(`'${this.config!.folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
        const resp = await this.fetchWithToken(`https://www.googleapis.com/drive/v3/files?q=${query}`);
        const data = await resp.json();

        const companies: Company[] = [];
        for (const file of (data.files || [])) {
            const companyData = await this.read<Company>('company.json', file.id);
            if (companyData) {
                companies.push({ ...companyData, path: file.id });
            }
        }
        return companies;
    }

    async createCompany(data: Omit<Company, 'id' | 'path'>): Promise<Company> {
        if (!this.isReady) throw new Error('Not initialized');

        const id = Math.random().toString(36).substr(2, 9);
        const folderName = `${data.name.replace(/\s+/g, '_')}_${id}`;

        const folderResp = await this.fetchWithToken('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [this.config!.folderId]
            })
        });
        const folder = await folderResp.json();

        const company: Company = { id, ...data, path: folder.id };
        await this.write('company.json', company, folder.id);

        return company;
    }

    async updateCompany(id: string, path: string, data: Partial<Omit<Company, 'id' | 'path'>>): Promise<Company> {
        const existing = await this.read<Company>('company.json', path);
        if (!existing) throw new Error('Company not found');

        const updated = { ...existing, ...data, id, path };
        await this.write('company.json', updated, path);
        return updated;
    }

    async deleteCompany(_id: string, path: string): Promise<void> {
        if (!this.isReady) throw new Error('Not initialized');
        await this.fetchWithToken(`https://www.googleapis.com/drive/v3/files/${path}`, {
            method: 'DELETE'
        });
    }

    async read<T>(filename: string, companyPath?: string): Promise<T | null> {
        if (!this.isReady) throw new Error('Not initialized');

        const parentId = companyPath || this.config!.folderId;
        const query = encodeURIComponent(`'${parentId}' in parents and name = '${filename}' and trashed = false`);
        const listResp = await this.fetchWithToken(`https://www.googleapis.com/drive/v3/files?q=${query}`);
        const listData = await listResp.json();

        if (!listData.files || listData.files.length === 0) return null;

        const fileId = listData.files[0].id;
        const contentResp = await this.fetchWithToken(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);

        return await contentResp.json();
    }

    async write<T>(filename: string, data: T, companyPath?: string): Promise<void> {
        if (!this.isReady) throw new Error('Not initialized');

        const parentId = companyPath || this.config!.folderId;
        const query = encodeURIComponent(`'${parentId}' in parents and name = '${filename}' and trashed = false`);
        const listResp = await this.fetchWithToken(`https://www.googleapis.com/drive/v3/files?q=${query}`);
        const listData = await listResp.json();

        const body = JSON.stringify(data, null, 2);

        if (listData.files && listData.files.length > 0) {
            const fileId = listData.files[0].id;
            await this.fetchWithToken(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body
            });
        } else {
            const metadata = { name: filename, parents: [parentId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([body], { type: 'application/json' }));

            await this.fetchWithToken('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                body: form
            });
        }
    }
}
