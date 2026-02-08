import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';
import { FileDown, ArrowRight } from 'lucide-react';
import type { Voucher } from '../../services/accounting/VoucherService';
import PeriodSelector from '../../components/ui/PeriodSelector';
import LedgerQuickView from './LedgerQuickView';
import React from 'react';
import { useReportDates } from './DateContext';

export default function TrialBalance() {
    const { provider, activeCompany } = usePersistence();
    const [groups, setGroups] = useState<GroupSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const { startDate, endDate } = useReportDates();

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;
            setLoading(true);

            const [ledgerData, customGroupsData, vouchersData] = await Promise.all([
                provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                provider.read<any[]>('custom_groups.json', activeCompany.path),
                provider.read<Voucher[]>('vouchers.json', activeCompany.path)
            ]);

            const ledgers = ledgerData || [];
            const customGroups = customGroupsData || [];
            const vouchers = vouchersData || [];

            // Re-register groups
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { AccountGroupManager } = await import('../../services/accounting/ReportService');
            customGroups.forEach((c: any) => AccountGroupManager.registerGroup(c.name, c.parentType));

            // Logic Adjustment:
            // For Balance Sheet items (Assets/Liabilities): Show Balance AS OF END DATE.
            // For P&L items (Income/Expenses): Show Net Movement BETWEEN START and END DATE.

            const balanceSheetTypes = ['ASSETS', 'LIABILITIES'] as const;
            const pnlTypes = ['INCOME', 'EXPENSES'] as const;

            let allSummaries: GroupSummary[] = [];

            // 1. Get Balance Sheet Items (As On End Date)
            balanceSheetTypes.forEach(type => {
                const summaries = ReportService.getAsOnGroupSummary(ledgers, vouchers, endDate, type);
                allSummaries = [...allSummaries, ...summaries];
            });

            // 2. Get P&L Items (Net Movement for Period)
            pnlTypes.forEach(type => {
                const summaries = ReportService.getPeriodGroupSummary(ledgers, vouchers, startDate, endDate, type);
                allSummaries = [...allSummaries, ...summaries];
            });

            // Clean up empty groups
            const activeGroups = allSummaries.filter(g => g.total !== 0 || g.ledgers.some(l => l.balance !== 0));

            setGroups(activeGroups);
            setLoading(false);
        };
        loadData();
    }, [provider, activeCompany, startDate, endDate]);

    // Calculate Grand Totals using the filtered ledger balances from the summaries
    const totalDebit = groups.reduce((sum, g) => {
        return sum + g.ledgers.reduce((lSum, l) => lSum + (l.type === 'Dr' ? l.balance : 0), 0);
    }, 0);

    const totalCredit = groups.reduce((sum, g) => {
        return sum + g.ledgers.reduce((lSum, l) => lSum + (l.type === 'Cr' ? l.balance : 0), 0);
    }, 0);

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-6xl mx-auto pb-12"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Trial Balance</h1>
                    <p className="text-muted-foreground font-medium">
                        Financial Position ({startDate} to {endDate})
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10"
                    >
                        <FileDown className="w-4 h-4" />
                        Print / Save PDF
                    </button>

                    <div className="flex items-center gap-2 no-print">
                        <PeriodSelector />
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] border-b border-border">
                        <tr>
                            <th className="px-8 py-4 text-left">Particulars</th>
                            <th className="px-8 py-4 text-right w-48">Debit ({activeCompany?.symbol || '₹'})</th>
                            <th className="px-8 py-4 text-right w-48">Credit ({activeCompany?.symbol || '₹'})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {groups.map(group => (
                            group.ledgers.length > 0 && (
                                <React.Fragment key={group.groupName}>
                                    <tr className="bg-muted/20">
                                        <td className="px-8 py-3 font-black text-foreground uppercase tracking-tight text-xs" colSpan={3}>
                                            {group.groupName}
                                        </td>
                                    </tr>
                                    {group.ledgers.map(ledger => (
                                        (ledger.balance !== 0) && (
                                            <tr key={ledger.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-8 py-3 font-medium text-foreground pl-12 flex items-center gap-2">
                                                    <ArrowRight className="w-3 h-3 text-muted-foreground mr-1" />
                                                    <LedgerQuickView ledgerName={ledger.name}>
                                                        <span className="hover:text-primary transition-colors cursor-help border-b border-dotted border-primary/30">
                                                            {ledger.name}
                                                        </span>
                                                    </LedgerQuickView>
                                                </td>
                                                <td className="px-8 py-3 text-right font-mono font-bold text-foreground">
                                                    {ledger.type === 'Dr' ? ledger.balance.toLocaleString() : ''}
                                                </td>
                                                <td className="px-8 py-3 text-right font-mono font-bold text-foreground">
                                                    {ledger.type === 'Cr' ? ledger.balance.toLocaleString() : ''}
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </React.Fragment>
                            )
                        ))}

                        <tr className="bg-muted/50 font-black text-foreground border-t-2 border-border">
                            <td className="px-8 py-5 uppercase tracking-widest text-xs">Grand Total</td>
                            <td className="px-8 py-5 text-right font-mono text-base">{activeCompany?.symbol || '₹'}{totalDebit.toLocaleString()}</td>
                            <td className="px-8 py-5 text-right font-mono text-base">{activeCompany?.symbol || '₹'}{totalCredit.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {Math.abs(totalDebit - totalCredit) > 0.01 && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 font-bold text-center text-sm">
                    ⚠️ Difference in Opening Balances: {(totalDebit - totalCredit).toLocaleString()}
                </div>
            )}
        </motion.div>
    );
}
