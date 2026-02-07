import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';
import { ChevronRight, ChevronDown, FileText, FileDown, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExportService } from '../../services/reports/ExportService';
import clsx from 'clsx';

export default function TrialBalance() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();

    const [groups, setGroups] = useState<{
        assets: GroupSummary[];
        liabilities: GroupSummary[];
        income: GroupSummary[];
        expenses: GroupSummary[];
    }>({ assets: [], liabilities: [], income: [], expenses: [] });

    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;
            const ledgerData = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];

            setGroups({
                assets: ReportService.getGroupSummary(ledgerData, 'ASSETS'),
                liabilities: ReportService.getGroupSummary(ledgerData, 'LIABILITIES'),
                income: ReportService.getGroupSummary(ledgerData, 'INCOME'),
                expenses: ReportService.getGroupSummary(ledgerData, 'EXPENSES')
            });
            setLoading(false);
        };
        loadData();
    }, [provider, activeCompany]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]
        );
    };

    const handleDrillDown = (ledgerId: string) => {
        navigate(`/ledgers?tab=vouchers&ledgerId=${ledgerId}`);
    };

    const calculateTotals = () => {
        let totalDebit = 0;
        let totalCredit = 0;

        const allGroups = [...groups.assets, ...groups.liabilities, ...groups.income, ...groups.expenses];

        allGroups.forEach(g => {
            g.ledgers.forEach(l => {
                if (l.type === 'Dr') totalDebit += l.balance;
                else totalCredit += l.balance;
            });
        });

        return { totalDebit, totalCredit };
    };

    const { totalDebit, totalCredit } = calculateTotals();
    const difference = Math.abs(totalDebit - totalCredit);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
        </div>
    );

    const renderGroupRows = (summary: GroupSummary, isDebitNature: boolean) => {
        const isExpanded = expandedGroups.includes(summary.groupName);
        const filteredLedgers = summary.ledgers.filter(l =>
            l.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredLedgers.length === 0 && searchQuery) return null;

        const showInDebit = (isDebitNature && summary.total > 0) || (!isDebitNature && summary.total < 0);
        const showInCredit = (isDebitNature && summary.total < 0) || (!isDebitNature && summary.total > 0);

        return (
            <div key={summary.groupName} className="border-b border-border/50 last:border-0">
                <button
                    onClick={() => toggleGroup(summary.groupName)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
                >
                    <div className="w-6 h-6 flex items-center justify-center text-muted-foreground group-hover:text-primary">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 text-left">
                        <span className="text-sm font-black uppercase tracking-widest text-foreground/80 group-hover:text-foreground">
                            {summary.groupName}
                        </span>
                    </div>
                    <div className="flex gap-8 text-sm font-mono font-bold w-96 justify-end">
                        {summary.total !== 0 && (
                            <div className="flex gap-8">
                                <span className={clsx("w-40 text-right", showInDebit ? "text-foreground" : "opacity-0")}>
                                    {showInDebit ? Math.abs(summary.total).toLocaleString() : ""}
                                </span>
                                <span className={clsx("w-40 text-right", showInCredit ? "text-foreground" : "opacity-0")}>
                                    {showInCredit ? Math.abs(summary.total).toLocaleString() : ""}
                                </span>
                            </div>
                        )}
                    </div>
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-muted/10"
                        >
                            <div className="py-2">
                                {filteredLedgers.map(ledger => (
                                    <button
                                        key={ledger.id}
                                        onClick={() => handleDrillDown(ledger.id)}
                                        className="w-full flex items-center gap-4 px-16 py-2.5 hover:bg-primary/5 transition-colors group/row"
                                    >
                                        <div className="flex-1 text-left flex items-center gap-3">
                                            <span className="text-sm font-medium text-muted-foreground group-hover/row:text-primary">
                                                {ledger.name}
                                            </span>
                                            <FileText className="w-3 h-3 opacity-0 group-hover/row:opacity-100 text-primary/50 transition-opacity" />
                                        </div>
                                        <div className="flex gap-8 text-sm font-mono font-medium w-96 justify-end">
                                            <span className={clsx("w-40 text-right", ledger.type === 'Dr' ? "text-muted-foreground/80" : "opacity-0")}>
                                                {ledger.type === 'Dr' ? ledger.balance.toLocaleString() : ""}
                                            </span>
                                            <span className={clsx("w-40 text-right", ledger.type === 'Cr' ? "text-muted-foreground/80" : "opacity-0")}>
                                                {ledger.type === 'Cr' ? ledger.balance.toLocaleString() : ""}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-8 pb-12"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Trial Balance</h1>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] mt-1">
                        Mathematical summary of all accounts
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group no-print">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find ledger..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all w-64"
                        />
                    </div>

                    <button
                        onClick={() => {
                            const rows: string[][] = [];
                            // Liabilities & Equity (Credit Nature)
                            const processGroup = (g: GroupSummary, isDebitNature: boolean) => {
                                const total = g.total;
                                const isDebit = (isDebitNature && total > 0) || (!isDebitNature && total < 0);
                                const isCredit = (isDebitNature && total < 0) || (!isDebitNature && total > 0);
                                const debitVal = isDebit ? Math.abs(total).toFixed(2) : "";
                                const creditVal = isCredit ? Math.abs(total).toFixed(2) : "";

                                rows.push([g.groupName.toUpperCase(), debitVal, creditVal]);
                                g.ledgers.forEach(l => {
                                    rows.push([`  ${l.name}`, l.type === 'Dr' ? l.balance.toFixed(2) : "", l.type === 'Cr' ? l.balance.toFixed(2) : ""]);
                                });
                            };

                            groups.liabilities.forEach(g => processGroup(g, false));
                            groups.assets.forEach(g => processGroup(g, true));
                            groups.income.forEach(g => processGroup(g, false));
                            groups.expenses.forEach(g => processGroup(g, true));

                            rows.push(["TOTAL", totalDebit.toFixed(2), totalCredit.toFixed(2)]);
                            ExportService.exportToPDF('Trial Balance', ['Particulars', 'Debit', 'Credit'], rows, activeCompany, {
                                1: { halign: 'right' },
                                2: { halign: 'right' }
                            });
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all"
                    >
                        <FileDown className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between gap-4">
                    <div className="flex-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Particulars</div>
                    <div className="hidden md:flex gap-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-96 justify-end">
                        <span className="w-40 text-right">Debit (Dr)</span>
                        <span className="w-40 text-right">Credit (Cr)</span>
                    </div>
                </div>

                <div className="divide-y divide-border">
                    <div className="bg-primary/[0.02] px-6 py-2 text-[10px] font-black text-primary uppercase tracking-widest">Liabilities & Equity</div>
                    {groups.liabilities.map(g => renderGroupRows(g, false))}

                    <div className="bg-cyan-500/[0.02] px-6 py-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest">Assets</div>
                    {groups.assets.map(g => renderGroupRows(g, true))}

                    <div className="bg-emerald-500/[0.02] px-6 py-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Income</div>
                    {groups.income.map(g => renderGroupRows(g, false))}

                    <div className="bg-amber-500/[0.02] px-6 py-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">Expenses</div>
                    {groups.expenses.map(g => renderGroupRows(g, true))}
                </div>

                <div className="bg-muted/50 p-8 border-t border-border mt-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between md:justify-end gap-8 text-sm font-black uppercase tracking-tighter w-full">
                                <div className="flex gap-8 w-96 justify-end">
                                    <div className="flex flex-col items-end w-40">
                                        <span className="text-[10px] text-muted-foreground tracking-widest mb-1">Grand Total Debit</span>
                                        <span className="text-2xl font-mono">{totalDebit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col items-end w-40">
                                        <span className="text-[10px] text-muted-foreground tracking-widest mb-1">Grand Total Credit</span>
                                        <span className="text-2xl font-mono">{totalCredit.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {difference > 0.01 && (
                        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between text-rose-500">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">Out of Balance</span>
                            </div>
                            <span className="font-mono font-bold">₹{difference.toLocaleString()}</span>
                        </div>
                    )}

                    {difference <= 0.01 && (
                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-black uppercase tracking-widest">Mathematical accuracy verified - All accounts balanced</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
