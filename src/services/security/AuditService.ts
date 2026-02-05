
export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entityType: 'VOUCHER' | 'LEDGER' | 'STOCK_ITEM';
    entityId: string;
    details: string; // e.g. "Voucher Sales #101 created"
    changes?: Record<string, { old: any, new: any }>;
}

export class AuditService {
    static async log(
        provider: any,
        companyPath: string,
        log: Omit<AuditLog, 'id' | 'timestamp' | 'userId'> & { userId?: string }
    ) {
        try {
            const logs = await provider.read('audit_logs.json', companyPath) || [];
            const newLog: AuditLog = {
                userId: 'System', // Default
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

    static async getLogs(provider: PersistenceProvider, companyPath: string): Promise<AuditLog[]> {
        return await provider.read<AuditLog[]>('audit_logs.json', companyPath) || [];
    }
}
