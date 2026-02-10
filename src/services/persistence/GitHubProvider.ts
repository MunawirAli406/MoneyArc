import { get, set } from 'idb-keyval';
import type { StorageProvider, Company } from './types';

const GH_CONFIG_KEY = 'moneyarc_github_config';

interface GitHubConfig {
    owner: string;
    repo: string;
    branch: string;
    path: string; // Base path in the repo
}

export class GitHubProvider implements StorageProvider {
    private config: GitHubConfig | null = null;
    public readonly: boolean = true;

    public get isReady(): boolean {
        return this.config !== null;
    }

    async init(initialConfig?: GitHubConfig): Promise<void> {
        if (initialConfig) {
            this.config = initialConfig;
            await set(GH_CONFIG_KEY, initialConfig);
        } else {
            // This is usually called from UI which already collected config
            const saved = await get<GitHubConfig>(GH_CONFIG_KEY);
            if (saved) {
                this.config = saved;
            } else {
                throw new Error('GitHub configuration missing');
            }
        }
    }

    async restore(): Promise<boolean> {
        const saved = await get<GitHubConfig>(GH_CONFIG_KEY);
        if (saved) {
            this.config = saved;
            return true;
        }
        return false;
    }

    private getRawUrl(filename: string, companyPath?: string): string {
        if (!this.config) throw new Error('GitHub provider not initialized');
        const { owner, repo, branch, path } = this.config;
        const fullPath = [path, companyPath, filename].filter(Boolean).join('/');
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fullPath}`;
    }

    async listCompanies(): Promise<Company[]> {
        if (!this.config) throw new Error('GitHub provider not initialized');

        // This is tricky because we can't easily list directories via raw github URL
        // We might need to use the GitHub API if listing is required.
        // For now, let's assume we fetch a 'companies_index.json' or use API.

        // Let's use the GitHub API to list directories if possible, 
        // but raw urls are better for data.
        // For 'listCompanies', we use the API:
        const { owner, repo, branch, path } = this.config;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

        try {
            const resp = await fetch(apiUrl);
            if (!resp.ok) throw new Error('Failed to fetch repository contents');
            const contents = await resp.json();

            const companies: Company[] = [];
            for (const item of contents) {
                if (item.type === 'dir') {
                    try {
                        const companyData = await this.read<Company>('company.json', item.name);
                        if (companyData) {
                            companies.push({
                                ...companyData,
                                path: item.name
                            });
                        }
                    } catch (e) {
                        console.warn(`Failed to read company at ${item.name}`, e);
                    }
                }
            }
            return companies;
        } catch (e) {
            console.error('Error listing companies from GitHub:', e);
            return [];
        }
    }

    async createCompany(_data: Omit<Company, 'id' | 'path'>): Promise<Company> {
        throw new Error('Writing to GitHub is not supported in this version. Use local storage for full features.');
    }

    async updateCompany(_id: string, _path: string, _data: Partial<Omit<Company, 'id' | 'path'>>): Promise<Company> {
        throw new Error('Writing to GitHub is not supported.');
    }

    async deleteCompany(_id: string, _path: string): Promise<void> {
        throw new Error('Writing to GitHub is not supported.');
    }

    async read<T>(filename: string, companyPath?: string): Promise<T | null> {
        const url = this.getRawUrl(filename, companyPath);
        try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (!resp.ok) {
                if (resp.status === 404) return null;
                throw new Error(`Failed to fetch ${filename}: ${resp.statusText}`);
            }
            return await resp.json() as T;
        } catch (e) {
            console.error(`Error reading ${filename} from GitHub:`, e);
            return null;
        }
    }

    async write<T>(_filename: string, _data: T, _companyPath?: string): Promise<void> {
        throw new Error('GitHub provider is read-only. Export your data manually if needed.');
    }

    async sync(): Promise<void> {
        // Since we use no-store by default, every read is already a "sync".
        // But we provide this method to allow explicit refresh and UI feedback.
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work
    }
}
