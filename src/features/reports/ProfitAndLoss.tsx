import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';
import { type StockItem } from '../../services/inventory/types';
import { TrendingUp, TrendingDown, FileDown, ChevronRight, ChevronDown } from 'lucide-react';
import type { Voucher } from '../../services/accounting/VoucherService';
import LedgerQuickView from './LedgerQuickView';
import { useReportDates } from './DateContext';
import PeriodSelector from '../../components/ui/PeriodSelector';


export default function ProfitAndLoss() {
    const { provider, activeCompany } = usePersistence();
    const [expenses, setExpenses] = useState<GroupSummary[]>([]);
    const [incomes, setIncomes] = useState<GroupSummary[]>([]);
    const [closingStock, setClosingStock] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const { startDate, endDate } = useReportDates();

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;
            setLoading(true);

            const [ledgerData, stockItemsData, customGroupsData, vouchersData] = await Promise.all([
                provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                provider.read<StockItem[]>('stock_items.json', activeCompany.path),
                provider.read<any[]>('custom_groups.json', activeCompany.path),
                provider.read<Voucher[]>('vouchers.json', activeCompany.path)
            ]);

            const ledgers = ledgerData || [];
            const stockItems = stockItemsData || [];
            const customGroups = customGroupsData || [];
            const vouchers = vouchersData || [];

            const { AccountGroupManager } = await import('../../services/accounting/ReportService');
            customGroups.forEach((c: any) => AccountGroupManager.registerGroup(c.name, c.parentType));

            const expenseData = ReportService.getPeriodGroupSummary(ledgers as Ledger[], vouchers, new Date(startDate), new Date(endDate), 'EXPENSES');
            const incomeData = ReportService.getPeriodGroupSummary(ledgers as Ledger[], vouchers, new Date(startDate), new Date(endDate), 'INCOME');
            const cs = ReportService.getClosingStockValue(stockItems);

            setExpenses(expenseData);
            setIncomes(incomeData);
            setClosingStock(cs);
            setLoading(false);
        };
        loadData();
    }, [provider, activeCompany, startDate, endDate]);

    const toggleGroup = (groupName: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName);
        } else {
            newExpanded.add(groupName);
        }
        setExpandedGroups(newExpanded);
    };

    const totalExpenses = ReportService.calculateTotal(expenses);
    const totalIncome = ReportService.calculateTotal(incomes) + closingStock;
    const netProfit = totalIncome - totalExpenses;

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    const maxSideTotal = Math.max(totalExpenses + (netProfit > 0 ? netProfit : 0), totalIncome + (netProfit < 0 ? Math.abs(netProfit) : 0));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-6xl mx-auto pb-12"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Statement of Profit & Loss</h1>
                    <p className="text-muted-foreground font-medium">Performance summary: {activeCompany?.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10"
                    >
                        <FileDown className="w-4 h-4" />
                        Print / Save PDF
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Expenses Side */}
                    <div className="flex flex-col">
                        <div className="p-6 bg-muted/30 border-b border-border font-black text-rose-500 uppercase text-[10px] tracking-[0.2em] text-center">
                            Operating Expenses
                        </div>
                        <div className="p-8 space-y-8 flex-1">
                            {expenses.map(group => (
                                group.total > 0 && (
                                    <div key={group.groupName} className="space-y-3">
                                        <div
                                            onClick={() => toggleGroup(group.groupName)}
                                            className="flex justify-between items-center group cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-xl transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedGroups.has(group.groupName) ? (
                                                    <ChevronDown className="w-4 h-4 text-rose-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                                                )}
                                                <span className="text-sm font-black text-foreground uppercase tracking-tight">{group.groupName}</span>
                                            </div>
                                            <span className="font-mono font-black text-base text-foreground">{activeCompany?.symbol || '₹'}{group.total.toLocaleString()}</span>
                                        </div>

                                        <AnimatePresence>
                                            {expandedGroups.has(group.groupName) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden space-y-1 border-l-2 border-rose-500/20 pl-4 ml-2"
                                                >
                                                    {group.ledgers.map(l => (
                                                        <div key={l.id} className="flex justify-between items-center text-xs font-bold text-muted-foreground/80 hover:text-foreground transition-colors py-1">
                                                            <LedgerQuickView ledgerName={l.name}>
                                                                <span className="hover:text-primary transition-colors cursor-help border-b border-dotted border-primary/30">{l.name}</span>
                                                            </LedgerQuickView>
                                                            <span className="font-mono text-[10px]">{l.balance.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Net Profit</span>
                                    </div>
                                    <span className="font-mono font-black text-emerald-600 text-lg">{activeCompany?.symbol || '₹'}{netProfit.toLocaleString()}</span>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-8 bg-muted/30 border-t border-border flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total debits</span>
                            <span className="text-2xl font-black text-foreground font-mono">{activeCompany?.symbol || '₹'}{maxSideTotal.toLocaleString()}</span>
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
                                    <div key={group.groupName} className="space-y-3">
                                        <div
                                            onClick={() => toggleGroup(group.groupName)}
                                            className="flex justify-between items-center group cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-xl transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedGroups.has(group.groupName) ? (
                                                    <ChevronDown className="w-4 h-4 text-cyan-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                                                )}
                                                <span className="text-sm font-black text-foreground uppercase tracking-tight">{group.groupName}</span>
                                            </div>
                                            <span className="font-mono font-black text-base text-foreground">{activeCompany?.symbol || '₹'}{group.total.toLocaleString()}</span>
                                        </div>

                                        <AnimatePresence>
                                            {expandedGroups.has(group.groupName) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden space-y-1 border-l-2 border-cyan-500/20 pl-4 ml-2"
                                                >
                                                    {group.ledgers.map(l => (
                                                        <div key={l.id} className="flex justify-between items-center text-xs font-bold text-muted-foreground/80 hover:text-foreground transition-colors py-1">
                                                            <LedgerQuickView ledgerName={l.name}>
                                                                <span className="hover:text-primary transition-colors cursor-help border-b border-dotted border-primary/30">{l.name}</span>
                                                            </LedgerQuickView>
                                                            <span className="font-mono text-[10px]">{l.balance.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            ))}

                            {closingStock > 0 && (
                                <div className="p-2 -mx-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-foreground uppercase tracking-tight hover:text-cyan-500 transition-colors">Closing Stock</span>
                                        <span className="font-mono font-black text-foreground text-base">{activeCompany?.symbol || '₹'}{closingStock.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

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
                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Net Loss</span>
                                    </div>
                                    <span className="font-mono font-black text-rose-600 text-lg">{activeCompany?.symbol || '₹'}{Math.abs(netProfit).toLocaleString()}</span>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-8 bg-muted/30 border-t border-border flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total credits</span>
                            <span className="text-2xl font-black text-foreground font-mono">{activeCompany?.symbol || '₹'}{maxSideTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Summary Pill */}
            <div className={`p-8 rounded-[2rem] border-2 text-center font-black text-sm tracking-widest uppercase transition-all ${netProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/5 border-rose-500/20 text-rose-500'}`}>
                {netProfit >= 0
                    ? `🎉 Excellent Performance: Net Profit of ${activeCompany?.symbol || '₹'}{netProfit.toLocaleString()}`
                    : `⚠ Critical Attention: Net Loss of ${activeCompany?.symbol || '₹'}{Math.abs(netProfit).toLocaleString()}`
                }
            </div>
        </motion.div >
    );
}
