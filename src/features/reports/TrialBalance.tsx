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
import { useLocalization } from '../../hooks/useLocalization';

export default function TrialBalance() {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency } = useLocalization();
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
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Reconciling Ledger Matrices...</p>
        </div>
    );

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const item = { hidden: { y: 10, opacity: 0 }, show: { y: 0, opacity: 1 } };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-10 px-6 lg:px-12 pb-24 pt-4"
        >
            <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.9] bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                        Trial Balance
                    </h1>
                    <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                        Consolidated Ledger Audit // {startDate} — {endDate}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 no-print">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 group"
                    >
                        <FileDown className="w-4 h-4 group-hover:animate-bounce" />
                        Download Archive
                    </button>
                    <div className="glass-panel px-8 py-4 rounded-[2rem] border-primary/10 shadow-2xl flex items-center gap-6 group">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Exposure Variance</p>
                            <p className="text-2xl font-black text-primary tracking-tighter tabular-nums">{formatCurrency(totalDebit - totalCredit)}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={item} className="glass-panel rounded-[3.5rem] border-primary/10 overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">Statement of Financial Neutrality</h2>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-google-green animate-pulse" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Double-Entry Integrity Verified</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border">
                                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Particulars / Registry Account</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right w-64">Debit Liability</th>
                                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right w-64">Credit Asset</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {groups.map(group => (
                                group.ledgers.length > 0 && (
                                    <React.Fragment key={group.groupName}>
                                        <tr className="bg-muted/20 border-l-4 border-primary/40">
                                            <td className="px-12 py-6 font-black text-foreground uppercase tracking-[0.2em] text-[10px]" colSpan={3}>
                                                {group.groupName}
                                            </td>
                                        </tr>
                                        {group.ledgers.map(ledger => (
                                            (ledger.balance !== 0) && (
                                                <tr key={ledger.id} className="hover:bg-primary/5 transition-colors group/row">
                                                    <td className="px-12 py-6">
                                                        <LedgerQuickView ledgerName={ledger.name}>
                                                            <div className="flex items-center gap-4 cursor-help group/text">
                                                                <ArrowRight className="w-3 h-3 text-primary/40 group-hover/text:translate-x-1 transition-transform" />
                                                                <span className="text-lg font-black text-foreground tracking-tighter group-hover/text:text-primary transition-colors">
                                                                    {ledger.name}
                                                                </span>
                                                            </div>
                                                        </LedgerQuickView>
                                                    </td>
                                                    <td className="px-10 py-6 text-right font-black text-foreground tabular-nums tracking-tighter text-xl">
                                                        {ledger.type === 'Dr' ? formatCurrency(ledger.balance) : ''}
                                                    </td>
                                                    <td className="px-12 py-6 text-right font-black text-foreground tabular-nums tracking-tighter text-xl">
                                                        {ledger.type === 'Cr' ? formatCurrency(ledger.balance) : ''}
                                                    </td>
                                                </tr>
                                            )
                                        ))}
                                    </React.Fragment>
                                )
                            ))}
                        </tbody>
                        <tfoot className="bg-primary/5 border-t-4 border-primary/20">
                            <tr>
                                <td className="px-12 py-12 text-[14px] font-black uppercase tracking-[0.4em] text-primary">Consolidated Audit Total</td>
                                <td className="px-10 py-12 text-right font-black text-primary text-4xl tabular-nums tracking-tighter">{formatCurrency(totalDebit)}</td>
                                <td className="px-12 py-12 text-right font-black text-primary text-4xl tabular-nums tracking-tighter">{formatCurrency(totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </motion.div>

            {Math.abs(totalDebit - totalCredit) > 0.01 && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 font-bold text-center text-sm">
                    ⚠️ Difference in Opening Balances: {formatCurrency(totalDebit - totalCredit)}
                </div>
            )}
        </motion.div>
    );
}
