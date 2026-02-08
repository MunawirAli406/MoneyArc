import type { StorageProvider } from '../persistence/types';
import type { Ledger } from './ReportService';
import type { StockItem } from '../inventory/types';
import { AuditService } from '../security/AuditService';

export interface InventoryEntry {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitId: string;
    rate: number;
    amount: number;
    batchNo?: string;
    expiryDate?: string;
}

export interface VoucherRow {
    id: number;
    type: 'Dr' | 'Cr';
    account: string; // Ledger Name
    debit: number;
    credit: number;
    inventoryAllocations?: InventoryEntry[];
}

export interface Voucher {
    id: string;
    voucherNo: string;
    date: string;
    type: string;
    narration: string;
    rows: VoucherRow[];
    currency?: string;
    exchangeRate?: number;
}

export class VoucherService {
    static async saveVoucher(provider: StorageProvider, voucher: Voucher, companyPath?: string): Promise<void> {
        if (!provider) throw new Error("Storage provider not initialized");

        const vouchers = await provider.read<Voucher[]>('vouchers.json', companyPath) || [];
        vouchers.push(voucher);
        await provider.write('vouchers.json', vouchers, companyPath);

        await this.applyImpact(provider, voucher, 1, companyPath);

        await AuditService.log(provider, companyPath || '', {
            action: 'CREATE',
            entityType: 'VOUCHER',
            entityId: voucher.id,
            details: `${voucher.type} Voucher #${voucher.voucherNo} recorded for ₹${voucher.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0).toLocaleString()}`
        });
    }

    static async deleteVoucher(provider: StorageProvider, voucherId: string, companyPath?: string): Promise<void> {
        if (!provider) throw new Error("Storage provider not initialized");

        const vouchers = await provider.read<Voucher[]>('vouchers.json', companyPath) || [];
        const voucher = vouchers.find(v => v.id === voucherId);
        if (!voucher) throw new Error("Voucher not found");

        // Reverse Impact
        await this.applyImpact(provider, voucher, -1, companyPath);

        // Remove from list
        const updatedVouchers = vouchers.filter(v => v.id !== voucherId);
        await provider.write('vouchers.json', updatedVouchers, companyPath);

        await AuditService.log(provider, companyPath || '', {
            action: 'DELETE',
            entityType: 'VOUCHER',
            entityId: voucherId,
            details: `${voucher.type} Voucher #${voucher.voucherNo} deleted`
        });
    }

    static async updateVoucher(provider: StorageProvider, voucher: Voucher, companyPath?: string): Promise<void> {
        if (!provider) throw new Error("Storage provider not initialized");

        const vouchers = await provider.read<Voucher[]>('vouchers.json', companyPath) || [];
        const oldVoucher = vouchers.find(v => v.id === voucher.id);

        if (oldVoucher) {
            // Revert old impact
            await this.applyImpact(provider, oldVoucher, -1, companyPath);
            // Replace in list
            const updatedVouchers = vouchers.map(v => v.id === voucher.id ? voucher : v);
            await provider.write('vouchers.json', updatedVouchers, companyPath);
        } else {
            vouchers.push(voucher);
            await provider.write('vouchers.json', vouchers, companyPath);
        }

        // Apply new impact
        await this.applyImpact(provider, voucher, 1, companyPath);

        await AuditService.log(provider, companyPath || '', {
            action: 'UPDATE',
            entityType: 'VOUCHER',
            entityId: voucher.id,
            details: `${voucher.type} Voucher #${voucher.voucherNo} modified`
        });
    }

    static async getNextVoucherNumber(provider: StorageProvider, voucherType: string, companyPath?: string): Promise<string> {
        if (!provider) return '1';
        const vouchers = await provider.read<Voucher[]>('vouchers.json', companyPath) || [];

        // Filter by type
        const typeVouchers = vouchers.filter(v => v.type === voucherType);

        if (typeVouchers.length === 0) return '1';

        // Sort by ID descending (assuming time-based or incremental IDs) to get the latest
        typeVouchers.sort((a, b) => b.id.localeCompare(a.id));
        const lastVoucher = typeVouchers[0];

        // Regex to match "Prefix" + "Suffix Number"
        // ^(.*?) matches any prefix (non-greedy)
        // (\d+)$ matches the trailing digits
        const match = lastVoucher.voucherNo.match(/^(.*?)(\d+)$/);

        if (match) {
            const prefix = match[1];
            const numberStr = match[2];
            const currentNum = parseInt(numberStr);
            let nextNumStr = (currentNum + 1).toString();

            // Preserve padding (e.g., 005 -> 006)
            while (nextNumStr.length < numberStr.length) {
                nextNumStr = "0" + nextNumStr;
            }

            return `${prefix}${nextNumStr}`;
        }

        // Fallback: If no trailing number, append "1" (e.g., "INV" -> "INV-1")
        // Check if it already has a separator?
        return `${lastVoucher.voucherNo}-1`;
    }

    private static async applyImpact(provider: StorageProvider, voucher: Voucher, multiplier: 1 | -1, companyPath?: string): Promise<void> {
        // 1. Update Ledger Balances
        const ledgers = await provider.read<Ledger[]>('ledgers.json', companyPath) || [];
        const ledgerMap = new Map(ledgers.map(l => [l.name, l]));

        for (const row of voucher.rows) {
            if (!row.account) continue;
            const ledger = ledgerMap.get(row.account);
            if (ledger) {
                const change = (row.type === 'Dr' ? row.debit : -row.credit) * multiplier;
                let currentSigned = ledger.balance * (ledger.type === 'Dr' ? 1 : -1);
                currentSigned += change;
                ledger.balance = Math.abs(currentSigned);
                ledger.type = currentSigned >= 0 ? 'Dr' : 'Cr';
            }
        }
        await provider.write('ledgers.json', ledgers, companyPath);

        // 2. Update Inventory
        const stockItems = await provider.read<StockItem[]>('stock_items.json', companyPath) || [];
        const stockMap = new Map(stockItems.map(i => [i.id, i]));
        let stockChanged = false;

        for (const row of voucher.rows) {
            if (row.inventoryAllocations) {
                for (const allocation of row.inventoryAllocations) {
                    const item = stockMap.get(allocation.itemId);
                    if (item) {
                        stockChanged = true;
                        if (item.currentBalance === undefined) {
                            item.currentBalance = item.openingStock;
                            item.currentRate = item.openingRate;
                            item.currentValue = item.openingValue;
                        }

                        const qtyChange = allocation.quantity * multiplier;
                        const valChange = allocation.amount * multiplier;

                        if (voucher.type === 'Purchase') {
                            item.currentBalance! += qtyChange;
                            item.currentValue! += valChange;
                        } else if (voucher.type === 'Sales') {
                            item.currentBalance! -= qtyChange;
                            // Re-calculate value at current average rate
                            item.currentValue = item.currentBalance! * item.currentRate!;
                        }

                        // Recalculate Average Rate if balance is positive
                        if (item.currentBalance! > 0) {
                            item.currentRate = item.currentValue! / item.currentBalance!;
                        }
                    }
                }
            }
        }

        if (stockChanged) {
            await provider.write('stock_items.json', stockItems, companyPath);
        }
    }

    static async getLedgerHistory(provider: StorageProvider, ledgerName: string, companyPath?: string): Promise<Voucher[]> {
        if (!provider) return [];
        const vouchers = await provider.read<Voucher[]>('vouchers.json', companyPath) || [];

        return vouchers
            .filter(v => v.rows.some(r => r.account === ledgerName))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }
}
