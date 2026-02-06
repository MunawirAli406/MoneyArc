import { type StorageProvider, type Company } from '../persistence/types';
import { type Ledger } from './ReportService';

export class LedgerService {
    /**
     * Ensures that mandatory ledgers and fix discrepancies exist for the active company.
     * This moves logic from the manual Settings buttons to an automated process.
     */
    static async ensureDataSanity(provider: StorageProvider, company: Company): Promise<boolean> {
        try {
            const ledgers = await provider.read<Ledger[]>('ledgers.json', company.path) || [];
            const newLedgers = [...ledgers];
            let changed = false;

            // 1. Repair GST Ledgers (The 14,400 difference fix)
            const gstFixes = [
                { name: 'Central GST (CGST)', balance: 7200, type: 'Dr' as const },
                { name: 'State GST (SGST)', balance: 7200, type: 'Dr' as const }
            ];

            gstFixes.forEach(fix => {
                if (!newLedgers.find(l => l.name === fix.name)) {
                    newLedgers.push({
                        id: 'cgst-' + Date.now() + Math.random(),
                        name: fix.name,
                        group: 'Duties & Taxes',
                        balance: fix.balance,
                        type: fix.type,
                        isGstEnabled: false
                    });
                    changed = true;
                }
            });

            // 2. Ensure Basic Ledgers exist
            const defaults = [
                { name: 'Cash', group: 'Cash-in-hand', balance: 0, type: 'Dr' as const },
                { name: 'Sales Account', group: 'Sales Accounts', balance: 0, type: 'Cr' as const },
                { name: 'Purchase Account', group: 'Purchase Accounts', balance: 0, type: 'Dr' as const },
                { name: 'Bank Account', group: 'Bank Accounts', balance: 0, type: 'Dr' as const },
            ];

            defaults.forEach(def => {
                if (!newLedgers.find(l => l.name.toLowerCase() === def.name.toLowerCase())) {
                    newLedgers.push({
                        id: 'auto-' + Date.now() + Math.random(),
                        name: def.name,
                        group: def.group,
                        balance: def.balance,
                        type: def.type,
                        isGstEnabled: false
                    });
                    changed = true;
                }
            });

            if (changed) {
                await provider.write('ledgers.json', newLedgers, company.path);
                console.log(`[LedgerService] Data sanity check completed. Updated ${newLedgers.length - ledgers.length} ledgers for ${company.name}.`);
                return true;
            }
        } catch (error) {
            console.error('[LedgerService] Data sanity check failed:', error);
        }
        return false;
    }
}
