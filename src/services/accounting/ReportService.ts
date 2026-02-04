
export interface Ledger {
    id: string;
    name: string;
    group: string;
    balance: number;
    type: 'Dr' | 'Cr';
}

export interface GroupSummary {
    groupName: string;
    total: number;
    ledgers: Ledger[];
}

export const ACCT_GROUPS = {
    ASSETS: ['Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Fixed Assets'],
    LIABILITIES: ['Sundry Creditors', 'Loans (Liability)', 'Duties & Taxes'],
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
}
