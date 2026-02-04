
import type { StorageProvider } from '../persistence/types';
import type { Ledger } from './ReportService';

export interface VoucherRow {
    id: number;
    type: 'Dr' | 'Cr';
    account: string; // Ledger Name
    debit: number;
    credit: number;
}

export interface Voucher {
    id: string;
    voucherNo: string;
    date: string;
    type: string;
    narration: string;
    rows: VoucherRow[];
}

export class VoucherService {
    static async saveVoucher(provider: StorageProvider, voucher: Voucher): Promise<void> {
        if (!provider) throw new Error("Storage provider not initialized");

        // 1. Save the Voucher
        const vouchers = await provider.read<Voucher[]>('vouchers.json') || [];
        vouchers.push(voucher);
        await provider.write('vouchers.json', vouchers);

        // 2. Update Ledger Balances
        const ledgers = await provider.read<Ledger[]>('ledgers.json') || [];

        // Create a map for fast lookup
        const ledgerMap = new Map(ledgers.map(l => [l.name, l]));

        // Process all ledgers involved in the voucher
        for (const row of voucher.rows) {
            if (!row.account) continue;

            const ledger = ledgerMap.get(row.account);
            if (ledger) {
                // Calculate impact
                // Dr increases Dr balance, Cr decreases Dr balance
                let change = 0;
                if (row.type === 'Dr') {
                    change = row.debit;
                } else {
                    change = -row.credit;
                }

                // Adjust based on Ledger's base type (Asset/Exp = Dr, Liab/Inc = Cr)
                // For simplicity, we just track raw 'Dr' or 'Cr' balance.
                // Current logic: simple addition/subtraction.

                // Convert current balance to signed number (Dr +, Cr -)
                let currentSigned = ledger.balance * (ledger.type === 'Dr' ? 1 : -1);
                currentSigned += change;

                ledger.balance = Math.abs(currentSigned);
                ledger.type = currentSigned >= 0 ? 'Dr' : 'Cr';
            }
        }

        // Reconstruct the ledgers list
        // (This is a simplified approach; in production, use IDs and transactional safety)
        await provider.write('ledgers.json', ledgers);
    }
}
