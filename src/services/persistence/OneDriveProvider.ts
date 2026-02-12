import { get, set, del } from 'idb-keyval';
import type { StorageProvider, Company } from './types';
import { MicrosoftAuth } from '../auth/MicrosoftAuth';

const ONEDRIVE_CONFIG_KEY = 'moneyarc_onedrive_config';

export class OneDriveProvider implements StorageProvider {
    private isInitialized = false;
    public readonly: boolean = false;

    public get isReady(): boolean {
        return this.isInitialized;
    }

    async init(token?: string): Promise<void> {
        if (token) {
            this.isInitialized = true;
            await set(ONEDRIVE_CONFIG_KEY, { initialized: true });
        } else {
            const saved = await get(ONEDRIVE_CONFIG_KEY);
            if (saved) {
                this.isInitialized = true;
            } else {
                throw new Error('OneDrive not connected');
            }
        }
    }

    async restore(): Promise<boolean> {
        const saved = await get(ONEDRIVE_CONFIG_KEY);
        if (saved) {
            this.isInitialized = true;
            return true;
        }
        return false;
    }

    async logout(): Promise<void> {
        this.isInitialized = false;
        await del(ONEDRIVE_CONFIG_KEY);
        await MicrosoftAuth.logout();
    }

    private async fetchWithToken(url: string, options: RequestInit = {}): Promise<Response> {
        const token = await MicrosoftAuth.getAccessToken();
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });
    }

    async listCompanies(): Promise<Company[]> {
        if (!this.isReady) throw new Error('Not initialized');

        const resp = await this.fetchWithToken('https://graph.microsoft.com/v1.0/me/drive/special/approot/children');
        const data = await resp.json();

        const companies: Company[] = [];
        for (const item of (data.value || [])) {
            if (item.folder) {
                const companyData = await this.read<Company>('company.json', item.name);
                if (companyData) {
                    companies.push({ ...companyData, path: item.name });
                }
            }
        }
        return companies;
    }

    async createCompany(data: Omit<Company, 'id' | 'path'>): Promise<Company> {
        if (!this.isReady) throw new Error('Not initialized');

        const id = Math.random().toString(36).substr(2, 9);
        const folderName = `${data.name.replace(/\s+/g, '_')}_${id}`;

        const company: Company = { id, ...data, path: folderName };
        await this.write('company.json', company, folderName);

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
        await this.fetchWithToken(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${path}`, {
            method: 'DELETE'
        });
    }

    async read<T>(filename: string, companyPath?: string): Promise<T | null> {
        if (!this.isReady) throw new Error('Not initialized');

        const path = [companyPath, filename].filter(Boolean).join('/');
        const url = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${path}:/content`;

        try {
            const resp = await this.fetchWithToken(url);
            if (!resp.ok) return null;
            return await resp.json();
        } catch {
            return null;
        }
    }

    async write<T>(filename: string, data: T, companyPath?: string): Promise<void> {
        if (!this.isReady) throw new Error('Not initialized');

        const path = [companyPath, filename].filter(Boolean).join('/');
        const url = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${path}:/content`;

        await this.fetchWithToken(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data, null, 2)
        });
    }
}
