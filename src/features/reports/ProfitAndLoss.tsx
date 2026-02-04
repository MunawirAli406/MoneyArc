import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, ACCT_GROUPS, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';
import { Calendar, TrendingUp, TrendingDown, FileDown } from 'lucide-react';
import { ExportService } from '../../services/reports/ExportService';

export default function ProfitAndLoss() {
    const { provider, activeCompany } = usePersistence();
    const [expenses, setExpenses] = useState<GroupSummary[]>([]);
    const [incomes, setIncomes] = useState<GroupSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;

            const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];

            const expenseData = ReportService.getGroupSummary(ledgers, ACCT_GROUPS.EXPENSES);
            const incomeData = ReportService.getGroupSummary(ledgers, ACCT_GROUPS.INCOME);

            setExpenses(expenseData);
            setIncomes(incomeData);
            setLoading(false);
        };
        loadData();
    }, [provider, activeCompany]);

    const totalExpenses = ReportService.calculateTotal(expenses);
    const totalIncome = ReportService.calculateTotal(incomes);
    const netProfit = totalIncome - totalExpenses;

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
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Statement of Profit & Loss</h1>
                    <p className="text-muted-foreground font-medium">Performance summary for {activeCompany?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            const rows: any[][] = [];

                            // Expenses Group
                            rows.push(['EXPENSES', '']);
                            expenses.forEach(g => {
                                if (g.total > 0) {
                                    rows.push([g.groupName.toUpperCase(), g.total.toFixed(2)]);
                                    g.ledgers.forEach(l => rows.push([`  ${l.name}`, l.balance.toFixed(2)]));
                                }
                            });

                            if (netProfit > 0) {
                                rows.push(['NET PROFIT (Transfer)', netProfit.toFixed(2)]);
                            }

                            rows.push(['---', '---']);

                            // Incomes Group
                            rows.push(['REVENUE / INCOME', '']);
                            incomes.forEach(g => {
                                if (g.total > 0) {
                                    rows.push([g.groupName.toUpperCase(), g.total.toFixed(2)]);
                                    g.ledgers.forEach(l => rows.push([`  ${l.name}`, l.balance.toFixed(2)]));
                                }
                            });

                            if (netProfit < 0) {
                                rows.push(['NET LOSS', Math.abs(netProfit).toFixed(2)]);
                            }

                            ExportService.exportToPDF('Profit & Loss Statement', ['Particulars', 'Amount (INR)'], rows, activeCompany);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10"
                    >
                        <FileDown className="w-4 h-4" />
                        Export PDF
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-xs font-bold text-muted-foreground uppercase tracking-widest border border-border">
                        <Calendar className="w-4 h-4" />
                        Period Ending {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Expenses Side */}
                    <div className="flex flex-col">
                        <div className="p-6 bg-muted/30 border-b border-border font-black text-rose-500 uppercase text-[10px] tracking-[0.2em] text-center">
                            Operating Expenses
                        </div>
                        <div className="p-8 space-y-8 flex-1">
                            {expenses.map(group => (
                                group.total > 0 && (
                                    <div key={group.groupName} className="space-y-4">
                                        <div className="flex justify-between items-baseline group cursor-pointer">
                                            <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-rose-500 transition-colors">{group.groupName}</span>
                                            <span className="font-mono font-bold text-foreground text-base">{group.total.toLocaleString()}</span>
                                        </div>
                                        <div className="space-y-2 border-l-2 border-muted pl-4 ml-1">
                                            {group.ledgers.map(l => (
                                                <div key={l.id} className="flex justify-between items-center text-sm font-medium text-muted-foreground/80 hover:text-foreground transition-colors py-0.5">
                                                    <span>{l.name}</span>
                                                    <span className="font-mono">{l.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}

                            {netProfit > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-between items-center bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 mt-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Transfer to Capital (NP)</span>
                                    </div>
                                    <span className="font-mono font-black text-emerald-600">{netProfit.toLocaleString()}</span>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-6 bg-muted/30 border-t border-border flex justify-between items-center px-8">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total debits</span>
                            <span className="text-xl font-black text-foreground font-mono">{Math.max(totalExpenses + (netProfit > 0 ? netProfit : 0), totalIncome).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Income Side */}
                    <div className="flex flex-col">
                        <div className="p-6 bg-muted/30 border-b border-border font-black text-cyan-500 uppercase text-[10px] tracking-[0.2em] text-center">
                            Revenue & Income
                        </div>
                        <div className="p-8 space-y-8 flex-1">
                            {incomes.map(group => (
                                group.total > 0 && (
                                    <div key={group.groupName} className="space-y-4">
                                        <div className="flex justify-between items-baseline group cursor-pointer">
                                            <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-cyan-500 transition-colors">{group.groupName}</span>
                                            <span className="font-mono font-bold text-foreground text-base">{group.total.toLocaleString()}</span>
                                        </div>
                                        <div className="space-y-2 border-l-2 border-muted pl-4 ml-1">
                                            {group.ledgers.map(l => (
                                                <div key={l.id} className="flex justify-between items-center text-sm font-medium text-muted-foreground/80 hover:text-foreground transition-colors py-0.5">
                                                    <span>{l.name}</span>
                                                    <span className="font-mono">{l.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}

                            {netProfit < 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-between items-center bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 mt-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500">
                                            <TrendingDown className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-rose-600">Net Loss (Transfer)</span>
                                    </div>
                                    <span className="font-mono font-black text-rose-600">{Math.abs(netProfit).toLocaleString()}</span>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-6 bg-muted/30 border-t border-border flex justify-between items-center px-8">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total credits</span>
                            <span className="text-xl font-black text-foreground font-mono">{Math.max(totalExpenses + (netProfit > 0 ? netProfit : 0), totalIncome).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Summary Pill */}
            <div className={`p-6 rounded-2xl border text-center font-bold text-sm tracking-wide ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                {netProfit >= 0
                    ? `🎉 Excellent! The company generated a Net Profit of ${netProfit.toLocaleString()}`
                    : `⚠ Attention: The company incurred a Net Loss of ${Math.abs(netProfit).toLocaleString()}`
                }
            </div>
        </motion.div>
    );
}
