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

// Extensibility Helper
export class AccountGroupManager {
    static customGroups = {
        ASSETS: [] as string[],
        LIABILITIES: [] as string[],
        INCOME: [] as string[],
        EXPENSES: [] as string[]
    };

    static registerGroup(name: string, type: keyof typeof ACCT_GROUPS) {
        if (!this.customGroups[type].includes(name)) {
            this.customGroups[type].push(name);
        }
    }

    static getGroups(type: keyof typeof ACCT_GROUPS): string[] {
        return [...ACCT_GROUPS[type], ...this.customGroups[type]];
    }

    static isAssetOrExpense(group: string): boolean {
        const assets = this.getGroups('ASSETS');
        const expenses = this.getGroups('EXPENSES');
        return assets.includes(group) || expenses.includes(group);
    }
}

export class ReportService {
    static getGroupSummary(ledgers: Ledger[], targetType: keyof typeof ACCT_GROUPS): GroupSummary[] {
        const targetGroups = AccountGroupManager.getGroups(targetType);

        return targetGroups.map(group => {
            const groupLedgers = ledgers.filter(l => l.group === group);

            // Determine natural sign of the group
            const isAssetOrExpense = AccountGroupManager.isAssetOrExpense(group);
            // Assets/Expenses: Dr is positive, Cr is negative
            // Liabilities/Income: Cr is positive, Dr is negative

            const total = groupLedgers.reduce((sum, l) => {
                let amount = l.balance;
                if (isAssetOrExpense) {
                    // Natural Debit: Add Dr, Subtract Cr
                    return sum + (l.type === 'Dr' ? amount : -amount);
                } else {
                    // Natural Credit: Add Cr, Subtract Dr
                    return sum + (l.type === 'Cr' ? amount : -amount);
                }
            }, 0);

            return {
                groupName: group,
                total,
                ledgers: groupLedgers
            };
        });
    }

    static getPeriodGroupSummary(ledgers: Ledger[], vouchers: any[], startDate: Date, endDate: Date, targetType: keyof typeof ACCT_GROUPS): GroupSummary[] {
        const targetGroups = AccountGroupManager.getGroups(targetType);
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);

        // Filter vouchers within period
        const periodVouchers = vouchers.filter(v => {
            const date = new Date(v.date).getTime();
            return date >= start && date <= end;
        });

        return targetGroups.map(group => {
            const groupLedgers = ledgers.filter(l => l.group === group);
            const isAssetOrExpense = AccountGroupManager.isAssetOrExpense(group);

            const total = groupLedgers.reduce((sum, ledger) => {
                // Calculate total transaction movement for this ledger in this period
                let ledgerTotal = 0;

                periodVouchers.forEach(v => {
                    const row = v.rows.find((r: any) => r.account === ledger.name);
                    if (row) {
                        const amount = row.type === 'Dr' ? row.debit : row.credit;

                        // For Asset/Expense: Dr is +, Cr is -
                        // For Liab/Income: Cr is +, Dr is -
                        if (isAssetOrExpense) {
                            ledgerTotal += (row.type === 'Dr' ? amount : -amount);
                        } else {
                            ledgerTotal += (row.type === 'Cr' ? amount : -amount);
                        }
                    }
                });

                return sum + ledgerTotal;
            }, 0);

            // Clone ledgers and update balance for display in drill-down
            const updatedLedgers = groupLedgers.map(l => {
                let lTotal = 0;
                periodVouchers.forEach(v => {
                    const row = v.rows.find((r: any) => r.account === l.name);
                    if (row) {
                        const amount = row.type === 'Dr' ? row.debit : row.credit;
                        if (isAssetOrExpense) {
                            lTotal += (row.type === 'Dr' ? amount : -amount);
                        } else {
                            lTotal += (row.type === 'Cr' ? amount : -amount);
                        }
                    }
                });
                return { ...l, balance: Math.abs(lTotal), type: (lTotal >= 0 ? (isAssetOrExpense ? 'Dr' : 'Cr') : (isAssetOrExpense ? 'Cr' : 'Dr')) as 'Dr' | 'Cr' };
            });

            return {
                groupName: group,
                total,
                ledgers: updatedLedgers
            };
        });
    }

    static getAsOnGroupSummary(ledgers: Ledger[], vouchers: any[], asOnDate: Date, targetType: keyof typeof ACCT_GROUPS): GroupSummary[] {
        const targetGroups = AccountGroupManager.getGroups(targetType);
        const end = new Date(asOnDate).setHours(23, 59, 59, 999);

        // Filter vouchers strictly AFTER the as-on date (Future)
        const futureVouchers = vouchers.filter(v => new Date(v.date).getTime() > end);

        return targetGroups.map(group => {
            const groupLedgers = ledgers.filter(l => l.group === group);
            const isAssetOrExpense = AccountGroupManager.isAssetOrExpense(group);

            const total = groupLedgers.reduce((sum, ledger) => {
                // Start with signed current balance: Dr is positive, Cr is negative (internally here)
                let signedBalance = (ledger.type === 'Dr' ? ledger.balance : -ledger.balance);

                // Reverse future transactions
                futureVouchers.forEach(v => {
                    const row = v.rows.find((r: any) => r.account === ledger.name);
                    if (row) {
                        // Current = Previous + Dr - Cr
                        // Previous = Current - Dr + Cr
                        const drAmount = row.type === 'Dr' ? row.debit : 0;
                        const crAmount = row.type === 'Cr' ? row.credit : 0;
                        signedBalance = signedBalance - drAmount + crAmount;
                    }
                });

                // Convert to Group nature sign
                if (isAssetOrExpense) {
                    return sum + signedBalance;
                } else {
                    return sum + (-signedBalance);
                }
            }, 0);

            // Update ledgers for drill-down display
            const updatedLedgers = groupLedgers.map(l => {
                let signedBalance = (l.type === 'Dr' ? l.balance : -l.balance);
                futureVouchers.forEach(v => {
                    const row = v.rows.find((r: any) => r.account === l.name);
                    if (row) {
                        const drAmount = row.type === 'Dr' ? row.debit : 0;
                        const crAmount = row.type === 'Cr' ? row.credit : 0;
                        signedBalance = signedBalance - drAmount + crAmount;
                    }
                });

                const finalBal = Math.abs(signedBalance);
                const finalType = signedBalance >= 0 ? 'Dr' : 'Cr'; // Return generic Ledger object
                return { ...l, balance: finalBal, type: finalType as 'Dr' | 'Cr' };
            });

            return {
                groupName: group,
                total,
                ledgers: updatedLedgers
            };
        });
    }

    static calculateTotal(summaries: GroupSummary[]): number {
        return summaries.reduce((sum, g) => sum + g.total, 0);
    }

    static getNetProfit(ledgers: Ledger[]): number {
        const income = this.calculateTotal(this.getGroupSummary(ledgers, 'INCOME'));
        const expenses = this.calculateTotal(this.getGroupSummary(ledgers, 'EXPENSES'));
        return income - expenses;
    }

    static getNetProfitPeriod(ledgers: Ledger[], vouchers: any[], startDate: Date, endDate: Date, stockItems: StockItem[]): number {
        const income = this.calculateTotal(this.getPeriodGroupSummary(ledgers, vouchers, startDate, endDate, 'INCOME'));
        const expenses = this.calculateTotal(this.getPeriodGroupSummary(ledgers, vouchers, startDate, endDate, 'EXPENSES'));

        // Simplified Stock Logic for V1:
        // Opening Stock: 0 (Assumed, unless Manual Stock Journal exists)
        // Closing Stock: Current Value (Assumed)

        const closingStock = this.getClosingStockValue(stockItems);
        const openingStock = 0;

        return (income + closingStock) - (expenses + openingStock);
    }

    static getNetProfitWithStock(ledgers: Ledger[], stockItems: StockItem[]): number {
        const income = this.calculateTotal(this.getGroupSummary(ledgers, 'INCOME'));
        const expenses = this.calculateTotal(this.getGroupSummary(ledgers, 'EXPENSES'));
        const closingStock = this.getClosingStockValue(stockItems);
        const openingStock = this.getOpeningStockValue(stockItems);

        return (income + closingStock) - (expenses + openingStock);
    }

    static getClosingStockValue(stockItems: StockItem[]): number {
        return stockItems.reduce((sum, item) => {
            const balance = item.currentBalance !== undefined ? item.currentBalance : item.openingStock;
            const rate = item.currentRate !== undefined ? item.currentRate : item.openingRate;
            return sum + (balance * rate);
        }, 0);
    }

    static getOpeningStockValue(stockItems: StockItem[]): number {
        return stockItems.reduce((sum, item) => {
            return sum + (item.openingStock * item.openingRate);
        }, 0);
    }

    static getTrialBalanceDiff(ledgers: Ledger[]): number {
        return ledgers.reduce((sum, l) => {
            // Debit adds, Credit subtracts
            return sum + (l.type === 'Dr' ? l.balance : -l.balance);
        }, 0);
    }

    static getLedgerBalanceAsOn(ledger: Ledger, vouchers: any[], asOnDate: Date): number {
        const end = new Date(asOnDate).setHours(23, 59, 59, 999);

        // Start with signed current balance: Dr is positive, Cr is negative
        let signedBalance = (ledger.type === 'Dr' ? ledger.balance : -ledger.balance);

        // Filter vouchers strictly AFTER the as-on date (Future)
        const futureVouchers = vouchers.filter(v => new Date(v.date).getTime() > end);

        // Reverse future transactions
        futureVouchers.forEach(v => {
            const row = v.rows.find((r: any) => r.account === ledger.name);
            if (row) {
                // Current = Previous + Dr - Cr
                // Previous = Current - Dr + Cr
                const drAmount = row.type === 'Dr' ? row.debit : 0;
                const crAmount = row.type === 'Cr' ? row.credit : 0;
                signedBalance = signedBalance - drAmount + crAmount;
            }
        });

        // Return signed balance (Dr +, Cr -)
        return signedBalance;
    }
}

export interface LedgerReportRow {
    date: string;
    voucherNo: string;
    voucherType: string;
    particulars: string;
    debit: number;
    credit: number;
    balance: number;
    balanceType: 'Dr' | 'Cr';
}

export interface LedgerReportData {
    ledgerName: string;
    openingBalance: number;
    openingBalanceType: 'Dr' | 'Cr';
    rows: LedgerReportRow[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingBalanceType: 'Dr' | 'Cr';
}

// Need to import Voucher type here, but circular dependency risk if we import form VoucherService. 
// Ideally move shared types to a types.ts, but for now copying or using 'any' safely.
// Actually, let's accept proper generic or define minimal interface.
interface SimpleVoucherRow {
    account: string;
    type: 'Dr' | 'Cr';
    debit: number;
    credit: number;
}
interface SimpleVoucher {
    id: string;
    date: string;
    voucherNo: string;
    type: string;
    rows: SimpleVoucherRow[];
}

export class LedgerReportCalculator {
    static getLedgerVouchers(
        targetLedger: Ledger,
        allVouchers: SimpleVoucher[],
        startDate: Date,
        endDate: Date
    ): LedgerReportData {
        // 1. Calculate Initial Opening Balance (from Ledger Master)
        // Note: Ledger Master balance IS the current balance. We need back-calculation or store initial OB separately.
        // Assuming 'ledger.balance' is CURRENT balance.
        // Actually, in this system, 'ledger.balance' is updated live.
        // So we can't easily retrieve "Original Opening Balance" from just the ledger object unless it's stored.
        // However, standard pattern: 
        // Start with 0. 
        // Replay ALL vouchers from beginning of time? Expensive.
        // Alternative: If we don't have historical snapshots, we might have to assume 'ledger.balance' is correct NOW, 
        // and work backwards? No, that's complex due to future dates.

        // BETTER APPROACH for this context: 
        // This is a local-first small business app. Replaying all vouchers is fine for now.
        // We need the 'Opening Balance' field from Ledger creation. 
        // Let's assume the 'ledger' object passed in has the CURRENT balance.
        // Wait, does Ledger have an 'openingBalance' field? 
        // Looking at interface Ledger: id, name, balance, type... No explicit 'openingBalance'.
        // If 'balance' is live, we are stuck.

        // CRITICAL FIX: The Ledger interface definition in ReportService.ts doesn't show 'openingBalance'.
        // BUT, usually accounting apps store `openingBalance` (master data) separate from `currentBalance`.
        // Let's check `PersistenceContext` or `ledger` creation.
        // If not, we have to assume the user started with 0 or the first voucher sets it?
        // Let's assume valid accounting: There SHOULD be an Opening Balance voucher or field.

        // FALLBACK STRATEGY: 
        // Calculate "Balance as of StartDate" by:
        // 1. Taking Current Balance.
        // 2. Subtracting all transactions AFTER StartDate? 
        //    Current = Opening + (Sum of All tx).
        //    Balance_at_Start = Current - (Sum of Tx from Start to Now).
        //    This works if 'Current' is truly accurate.

        // Let's implement Back-Calculation from Current Balance.

        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);

        // Sort vouchers descending to work backwards from current? 
        // Or Ascending to build forwards?
        // Let's work backwards from Current Balance to find Opening Balance of the period.

        // Filter vouchers for this ledger
        const ledgerVouchers = allVouchers.filter(v => v.rows.some(r => r.account === targetLedger.name));

        // Sort all vouchers by date ascending
        ledgerVouchers.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate Opening Balance for the PERIOD
        // We know Current Balance (at end of time/now).
        // But 'Current Balance' might include future vouchers if any? 
        // Let's assume 'ledger.balance' is the sum of ALL vouchers.

        // Step 1: Calculate "True Opening Balance" (System start)
        // If we can't trust 'Current - All Tx', we are in trouble.
        // Let's trust proper forward calculation if we had an initial.
        // Since we lack explicit 'Initial Opening Balance' in model, let's try Back Calculation.

        let runningBalance = targetLedger.balance * (targetLedger.type === 'Dr' ? 1 : -1);

        // Filter vouchers AFTER the End Date (Future relative to report)
        const futureVouchers = ledgerVouchers.filter(v => new Date(v.date).getTime() > end);

        // Rewind future transactions to get Balance at End Date
        futureVouchers.forEach(v => {
            const row = v.rows.find(r => r.account === targetLedger.name);
            if (row) {
                // If Dr, it added to balance. So subtract.
                // If Cr, it subtracted. So add.
                const amount = (row.type === 'Dr' ? row.debit : -row.credit);
                runningBalance -= amount;
            }
        });

        const closingBalanceOfPeriod = runningBalance;
        let runningBalanceWalk = closingBalanceOfPeriod;

        // Now we are at Closing Balance of Period.
        // We need to walk BACKWARDS through the Period to find Opening Balance.
        const periodVouchers = ledgerVouchers.filter(v => {
            const d = new Date(v.date).getTime();
            return d >= start && d <= end;
        });

        // Reversing period vouchers to walk back
        [...periodVouchers].reverse().forEach(v => {
            const row = v.rows.find(r => r.account === targetLedger.name);
            if (row) {
                const amount = (row.type === 'Dr' ? row.debit : -row.credit);
                runningBalanceWalk -= amount;
            }
        });

        const openingBalanceOfPeriod = runningBalanceWalk;

        // Now Build the Report Forwards
        const reportRows: LedgerReportRow[] = [];
        let currentRun = openingBalanceOfPeriod;
        let totalDebit = 0;
        let totalCredit = 0;

        periodVouchers.forEach(v => {
            const row = v.rows.find(r => r.account === targetLedger.name);
            if (!row) return;

            // Find 'Particulars' (Contra account)
            // Simple logic: First row that isn't this one.
            const contraRow = v.rows.find(r => r.account !== targetLedger.name);
            const particulars = contraRow ? contraRow.account : 'As per Details';

            const debit = row.type === 'Dr' ? row.debit : 0;
            const credit = row.type === 'Cr' ? row.credit : 0;

            totalDebit += debit;
            totalCredit += credit;

            // Update Run
            // Asset/Exp/Dr-Ledger: Dr increases, Cr decreases?
            // Actually mathematically: Balance is signed.
            // If we stick to Signed Balance:
            // Dr is positive (+), Cr is negative (-).
            const change = (row.type === 'Dr' ? debit : -credit);
            currentRun += change;

            reportRows.push({
                date: v.date,
                voucherNo: v.voucherNo,
                voucherType: v.type,
                particulars,
                debit,
                credit,
                balance: Math.abs(currentRun),
                balanceType: currentRun >= 0 ? 'Dr' : 'Cr'
            });
        });

        return {
            ledgerName: targetLedger.name,
            openingBalance: Math.abs(openingBalanceOfPeriod),
            openingBalanceType: openingBalanceOfPeriod >= 0 ? 'Dr' : 'Cr',
            rows: reportRows,
            totalDebit,
            totalCredit,
            closingBalance: Math.abs(closingBalanceOfPeriod),
            closingBalanceType: closingBalanceOfPeriod >= 0 ? 'Dr' : 'Cr'
        };
    }
}
