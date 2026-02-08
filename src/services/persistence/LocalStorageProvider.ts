import type { StorageProvider, Company } from './types';

const STORAGE_PREFIX = 'moneyarc_';
const COMPANIES_KEY = 'moneyarc_companies';

export class LocalStorageProvider implements StorageProvider {
    public readonly readonly = false;

    public get isReady(): boolean {
        return true;
    }

    async init(): Promise<void> {
        // No initialization needed for localStorage
        return Promise.resolve();
    }

    async listCompanies(): Promise<Company[]> {
        try {
            const stored = localStorage.getItem(COMPANIES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to list companies', e);
            return [];
        }
    }

    async createCompany(data: Omit<Company, 'id' | 'path'>): Promise<Company> {
        const id = Math.random().toString(36).substr(2, 9);
        const folderName = `${data.name.replace(/\s+/g, '_')}_${id}`; // Acts as "path"

        const newCompany: Company = {
            id,
            ...data,
            path: folderName
        };

        const companies = await this.listCompanies();
        companies.push(newCompany);
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));

        // Initialize company file
        await this.write('company.json', newCompany, folderName);

        return newCompany;
    }

    async updateCompany(id: string, path: string, data: Partial<Omit<Company, 'id' | 'path'>>): Promise<Company> {
        const companies = await this.listCompanies();
        const index = companies.findIndex(c => c.id === id);

        if (index === -1) throw new Error('Company not found');

        const updatedCompany = {
            ...companies[index],
            ...data,
            id,
            path
        };

        companies[index] = updatedCompany;
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));

        // Update company file
        await this.write('company.json', updatedCompany, path);

        return updatedCompany;
    }

    async read<T>(filename: string, companyPath?: string): Promise<T | null> {
        try {
            const key = this.getKey(filename, companyPath);
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to read file', e);
            return null;
        }
    }

    async write<T>(filename: string, data: T, companyPath?: string): Promise<void> {
        try {
            const key = this.getKey(filename, companyPath);
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to write file', e);
            throw e;
        }
    }

    private getKey(filename: string, companyPath?: string): string {
        return `${STORAGE_PREFIX}${companyPath ? companyPath + '_' : ''}${filename}`;
    }
}
