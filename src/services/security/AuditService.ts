import type { StorageProvider } from '../persistence/types';

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entityType: 'VOUCHER' | 'LEDGER' | 'STOCK_ITEM';
    entityId: string;
    details: string; // e.g. "Voucher Sales #101 created"
    changes?: Record<string, { old: unknown, new: unknown }>;
}

export class AuditService {
    private static _currentUser: { name: string; id: string } | null = null;

    static setCurrentUser(user: { name: string; id: string } | null) {
        this._currentUser = user;
    }

    static getCurrentUser() {
        return this._currentUser;
    }

    static async log(
        provider: StorageProvider,
        companyPath: string,
        log: Omit<AuditLog, 'id' | 'timestamp' | 'userId'> & { userId?: string }
    ) {
        try {
            const logs = await provider.read<AuditLog[]>('audit_logs.json', companyPath) || [];
            let userName = this._currentUser?.name;

            // Fallback: Try to recover user from localStorage if memory state is lost
            if (!userName && typeof window !== 'undefined' && window.localStorage) {
                try {
                    const savedUser = localStorage.getItem('moneyarc_auth_user');
                    if (savedUser) {
                        const parsed = JSON.parse(savedUser);
                        if (parsed?.name) {
                            userName = parsed.name;
                            this._currentUser = parsed; // Restore memory state
                        }
                    }
                } catch (e) {
                    // Ignore storage errors
                }
            }

            const newLog: AuditLog = {
                userId: userName || 'SYSTEM', // Use current logged in user name or fallback
                ...log,
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
            };
            logs.unshift(newLog); // Newest first
            // Keep only last 1000 logs for performance
            await provider.write('audit_logs.json', logs.slice(0, 1000), companyPath);
        } catch (error) {
            console.error("Failed to write audit log", error);
        }
    }

    static async getLogs(provider: StorageProvider, companyPath: string): Promise<AuditLog[]> {
        return await provider.read<AuditLog[]>('audit_logs.json', companyPath) || [];
    }

    static async updateAllLogsToUser(provider: StorageProvider, companyPath: string, userName: string) {
        const logs = await this.getLogs(provider, companyPath);
        const updatedLogs = logs.map(log => {
            // Only claim logs that are unattributed
            if (log.userId === 'SYSTEM' || log.userId === 'System' || !log.userId || log.userId === 'Unknown') {
                return { ...log, userId: userName };
            }
            return log;
        });
        await provider.write('audit_logs.json', updatedLogs, companyPath);
    }
}
