import { type StockItem } from '../inventory/types';

export interface Ledger {
    id: string;
    name: string;
    group: string;
    category?: string;
    balance: number;
    type: 'Dr' | 'Cr';
    gstin?: string;
    address?: string;
    state?: string;
    isGstEnabled: boolean;
}

export interface GroupSummary {
    groupName: string;
    total: number;
    ledgers: Ledger[];
}

export const ACCT_GROUPS = {
    ASSETS: ['Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Fixed Assets', 'Stock-in-hand', 'Current Assets', 'Loans & Advances (Asset)'],
    LIABILITIES: ['Capital Account', 'Sundry Creditors', 'Loans (Liability)', 'Duties & Taxes', 'Current Liabilities', 'Reserves & Surplus'],
    INCOME: ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes'],
    EXPENSES: ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'],
};

export class ReportService {
    static getGroupSummary(ledgers: Ledger[], targetGroups: string[]): GroupSummary[] {
        return targetGroups.map(group => {
            const groupLedgers = ledgers.filter(l => l.group === group);
            const total = groupLedgers.reduce((sum, l) => sum + l.balance, 0);
            return {
                groupName: group,
                total,
                ledgers: groupLedgers
            };
        });
    }

    static calculateTotal(summaries: GroupSummary[]): number {
        return summaries.reduce((sum, g) => sum + g.total, 0);
    }

    static getNetProfit(ledgers: Ledger[]): number {
        const income = this.calculateTotal(this.getGroupSummary(ledgers, ACCT_GROUPS.INCOME));
        const expenses = this.calculateTotal(this.getGroupSummary(ledgers, ACCT_GROUPS.EXPENSES));
        return income - expenses;
    }

    static getClosingStockValue(stockItems: StockItem[]): number {
        return stockItems.reduce((sum, item) => {
            const balance = item.currentBalance !== undefined ? item.currentBalance : item.openingStock;
            const rate = item.currentRate !== undefined ? item.currentRate : item.openingRate;
            return sum + (balance * rate);
        }, 0);
    }
}
