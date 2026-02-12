import { type StockItem } from '../inventory/types';

export interface Ledger {
    id: string;
    name: string;
    group: string;
    category?: string;
    balance: number;
    type: 'Dr' | 'Cr';
    gstin?: string;
    registrationType?: 'Regular' | 'Composition' | 'Unregistered' | 'Consumer';
    partyType?: 'Not Applicable' | 'Deemed Export' | 'Embassy' | 'Government Entity' | 'SEZ';
    placeOfSupply?: string;
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

    static getPeriodGroupSummary(ledgers: Ledger[], vouchers: any[], startDate: Date | string, endDate: Date | string, targetType: keyof typeof ACCT_GROUPS): GroupSummary[] {
        const targetGroups = AccountGroupManager.getGroups(targetType);

        // Ensure string format for comparison (YYYY-MM-DD)
        const start = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        const end = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;

        // Filter vouchers within period using string comparison
        const periodVouchers = vouchers.filter(v => v.date >= start && v.date <= end);

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

    static getAsOnGroupSummary(ledgers: Ledger[], vouchers: any[], asOnDate: Date | string, targetType: keyof typeof ACCT_GROUPS): GroupSummary[] {
        const targetGroups = AccountGroupManager.getGroups(targetType);
        const end = asOnDate instanceof Date ? asOnDate.toISOString().split('T')[0] : asOnDate;

        // Filter vouchers strictly AFTER the as-on date (Future)
        const futureVouchers = vouchers.filter(v => v.date > end);

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

    static getFinancialYearStart(date: Date | string): string {
        let d: Date;
        if (typeof date === 'string') {
            const [y, m, day] = date.split('-').map(Number);
            d = new Date(y, m - 1, day);
        } else {
            d = date;
        }
        const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
        return `${year}-04-01`;
    }

    static calculateTotal(summaries: GroupSummary[]): number {
        return summaries.reduce((sum, g) => sum + g.total, 0);
    }

    static getNetProfit(ledgers: Ledger[]): number {
        const income = this.calculateTotal(this.getGroupSummary(ledgers, 'INCOME'));
        const expenses = this.calculateTotal(this.getGroupSummary(ledgers, 'EXPENSES'));
        return income - expenses;
    }

    static getNetProfitPeriod(ledgers: Ledger[], vouchers: any[], startDate: string | Date, endDate: string | Date, stockItems: StockItem[]): number {
        const income = this.calculateTotal(this.getPeriodGroupSummary(ledgers, vouchers, startDate, endDate, 'INCOME'));
        const expenses = this.calculateTotal(this.getPeriodGroupSummary(ledgers, vouchers, startDate, endDate, 'EXPENSES'));

        // For Period P&L:
        // Result = (Income + Closing Stock) - (Expenses + Opening Stock)
        const closingStock = this.getClosingStockValue(stockItems, vouchers, endDate);
        const openingStock = this.getClosingStockValue(stockItems, vouchers, startDate);

        return (income + closingStock) - (expenses + openingStock);
    }

    static getNetProfitWithStock(ledgers: Ledger[], stockItems: StockItem[]): number {
        const income = this.calculateTotal(this.getGroupSummary(ledgers, 'INCOME'));
        const expenses = this.calculateTotal(this.getGroupSummary(ledgers, 'EXPENSES'));
        const closingStock = this.getClosingStockValue(stockItems);
        const openingStock = this.getOpeningStockValue(stockItems);

        return (income + closingStock) - (expenses + openingStock);
    }

    static getClosingStockValue(stockItems: StockItem[], vouchers?: any[], asOnDate?: string | Date): number {
        const end = asOnDate ? (asOnDate instanceof Date ? asOnDate.toISOString().split('T')[0] : asOnDate) : null;

        return stockItems.reduce((sum, item) => {
            let balance = item.currentBalance !== undefined ? item.currentBalance : item.openingStock;
            const rate = item.currentRate !== undefined ? item.currentRate : item.openingRate;

            // If asOnDate is provided, backtrack from current balance
            if (end && vouchers) {
                const futureVouchers = vouchers.filter(v => v.date > end);
                futureVouchers.forEach(v => {
                    v.rows.forEach((row: any) => {
                        if (row.inventoryAllocations) {
                            row.inventoryAllocations.forEach((alloc: any) => {
                                if (alloc.itemId === item.id) {
                                    const qtyChange = alloc.quantity;
                                    if (v.type === 'Purchase') {
                                        balance -= qtyChange;
                                    } else if (v.type === 'Sales') {
                                        balance += qtyChange;
                                    }
                                }
                            });
                        }
                    });
                });
            }

            return sum + (balance * rate);
        }, 0);
    }

    static getOpeningStockValue(stockItems: StockItem[]): number {
        return stockItems.reduce((sum, item) => {
            return sum + (item.openingStock * item.openingRate);
        }, 0);
    }

    static getTrialBalanceDiff(ledgers: Ledger[], vouchers?: any[], asOnDate?: string | Date): number {
        if (!asOnDate || !vouchers) {
            return ledgers.reduce((sum, l) => {
                return sum + (l.type === 'Dr' ? l.balance : -l.balance);
            }, 0);
        }

        return ledgers.reduce((sum, l) => {
            const balance = this.getLedgerBalanceAsOn(l, vouchers, asOnDate);
            return sum + balance;
        }, 0);
    }

    static getGstSlabBreakdown(ledgers: Ledger[], vouchers: any[], startDate: string, endDate: string) {
        // Simple logic for V1: Group Duties & Taxes ledgers that might be GST
        const gstGroups = ['Duties & Taxes'];
        const gstLedgers = ledgers.filter(l => gstGroups.includes(l.group));

        return gstLedgers.map(l => {
            const bal = this.getLedgerBalanceAsOn(l, vouchers, endDate) - this.getLedgerBalanceAsOn(l, vouchers, startDate);
            return {
                name: l.name,
                impact: bal,
                type: bal >= 0 ? 'Dr' : 'Cr'
            };
        });
    }

    static getNegativeBalanceLedgers(ledgers: Ledger[]) {
        return ledgers.filter(l => {
            // Cash & Bank should not be Cr
            if (['Cash-in-hand', 'Bank Accounts'].includes(l.group) && l.type === 'Cr') return true;
            // Debtors should not be Cr (usually)
            if (['Sundry Debtors'].includes(l.group) && l.type === 'Cr') return true;
            // Creditors should not be Dr (usually)
            if (['Sundry Creditors'].includes(l.group) && l.type === 'Dr') return true;
            return false;
        });
    }

    static getLedgerBalanceAsOn(ledger: Ledger, vouchers: any[], asOnDate: Date | string): number {
        const end = asOnDate instanceof Date ? asOnDate.toISOString().split('T')[0] : asOnDate;

        // Start with signed current balance: Dr is positive, Cr is negative
        let signedBalance = (ledger.type === 'Dr' ? ledger.balance : -ledger.balance);

        // Filter vouchers strictly AFTER the as-on date (Future)
        const futureVouchers = vouchers.filter(v => v.date > end);

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
    id: string;
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

        const start = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        const end = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;

        // Filter vouchers for this ledger
        const ledgerVouchers = allVouchers.filter(v => v.rows.some(r => r.account === targetLedger.name));

        // Sort all vouchers by date ascending
        ledgerVouchers.sort((a, b) => a.date.localeCompare(b.date));

        let runningBalance = targetLedger.balance * (targetLedger.type === 'Dr' ? 1 : -1);

        // Filter vouchers AFTER the End Date (Future relative to report)
        const futureVouchers = ledgerVouchers.filter(v => v.date > end);

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
        const periodVouchers = ledgerVouchers.filter(v => v.date >= start && v.date <= end);

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
                id: v.id,
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
