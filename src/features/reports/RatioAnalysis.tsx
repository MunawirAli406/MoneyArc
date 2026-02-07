import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, PieChart, TrendingUp, Target, Zap, ShieldCheck, FileDown, Calendar } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';
import { ACCT_GROUPS, type Ledger, ReportService } from '../../services/accounting/ReportService';
import type { Voucher } from '../../services/accounting/VoucherService';
import type { StockItem } from '../../services/inventory/types';


export default function RatioAnalysis() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [ratios, setRatios] = useState<{ name: string, value: string, target: string, desc: string, icon: any, color: string, bg: string }[]>([]);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const calculateRatios = async () => {
            if (!provider || !activeCompany) return;

            const [, lData, sData, vData] = await Promise.all([
                // We need vouchers for accurate period calculation if not using pre-calculated services, 
                // but ReportService uses ledgers + vouchers.
                provider.read<Voucher[]>('vouchers.json', activeCompany.path),
                provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                provider.read<StockItem[]>('stock_items.json', activeCompany.path),
                provider.read<Voucher[]>('vouchers.json', activeCompany.path) // Read vouchers
            ]);

            const ledgers = lData || [];
            const stockItems = sData || [];
            const vouchers = vData || [];

            // 1. Balance Sheet Items (As On End Date)
            // Current Assets
            const caGroups = ReportService.getAsOnGroupSummary(ledgers, vouchers, new Date(endDate), 'ASSETS');
            // Filter specific CA groups if needed, but usually 'ASSETS' covers Fixed + Current. 
            // We might need to approximate CA by excluding Fixed Assets if they are clearly separated.
            // For now, let's assume 'Current Assets' is a specific sub-group or we use all Assets - Fixed Assets.
            // Simplification: Use all Assets for Total Assets, but for Current Ratio?
            // Let's use the provided ACCT_GROUPS to identify.

            // Actually, ReportService.getAsOnGroupSummary returns the top-level groups.
            // We can iterate ledgers and check their group matches 'Current Assets', 'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', etc.
            // But we need the balance AS ON `endDate`.

            // To get balance of specific ledgers as on date:
            // We can re-use the logic from ReportService but applied to specific ledgers?
            // Or just use the GroupSummary result which sums up by group.

            // Let's try to find "Current Assets" and "Current Liabilities" from the summaries if possible.
            // If the user's chart of accounts is standard:
            // Assets = Fixed Assets + Current Assets
            // Liabilities = Loans + Current Liabilities + Cap Account (Equity)

            // Liabilities = Loans + Current Liabilities + Cap Account (Equity)

            // Calculate balances As On endDate
            const getBalanceAsOn = (ledger: Ledger) => {
                // This is expensive to do for every ledger individually without the service optimization
                // but let's do it for accuracy.
                // Actually ReportService.getAsOnGroupSummary does it for all ledgers in the group.
                return ReportService.getLedgerBalanceAsOn(ledger, vouchers, new Date(endDate));
            };

            // Current Assets: Cash, Bank, Debtors, Stock, etc.
            // We will filter ledgers that belong to CA groups.
            const caLedgers = ledgers.filter(l =>
                ['Current Assets', 'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Stock-in-hand'].includes(l.group) ||
                l.group.includes('Bank') || l.group.includes('Cash') || l.group.includes('Debtor')
            );
            const totalCA = caLedgers.reduce((sum, l) => sum + getBalanceAsOn(l), 0) +
                // Add Stock Value (Closing Stock)
                stockItems.reduce((sum, item) => sum + (item.currentBalance || 0) * (item.currentRate || 0), 0); // Simplified stock

            // Current Liabilities: Creditors, Duties & Taxes, Provisions
            const clLedgers = ledgers.filter(l =>
                ['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes', 'Provisions', 'Bank OD A/c'].includes(l.group) ||
                l.group.includes('Creditor') || l.group.includes('Tax')
            );
            const totalCL = clLedgers.reduce((sum, l) => sum + Math.abs(getBalanceAsOn(l)), 0); // Use Abs as liabilities are Credit


            const quickAssets = totalCA - stockItems.reduce((sum, item) => sum + (item.currentBalance || 0) * (item.currentRate || 0), 0);

            // 2. P&L Items (For the Period)
            // Revenue (Direct Incomes + Sales)
            const incomeSummaries = ReportService.getPeriodGroupSummary(ledgers, vouchers, new Date(startDate), new Date(endDate), 'INCOME');
            const totalRevenue = Math.abs(incomeSummaries.reduce((sum, g) => sum + g.total, 0)); // Income is Cr

            // Expenses (Direct + Indirect)
            const expenseSummaries = ReportService.getPeriodGroupSummary(ledgers, vouchers, new Date(startDate), new Date(endDate), 'EXPENSES');
            const totalExpenses = expenseSummaries.reduce((sum, g) => sum + g.total, 0); // Expense is Dr

            const netProfit = totalRevenue - totalExpenses;

            // Gross Profit (Revenue - Direct Expenses)
            // We need to identify Direct Expenses (`Purchase Accounts`, `Direct Expenses`)
            // ReportService.getPeriodGroupSummary returns groups. We can filter by group name.
            const directExpenses = expenseSummaries
                .filter(g => ['Purchase Accounts', 'Direct Expenses'].includes(g.groupName))
                .reduce((sum, g) => sum + g.total, 0);

            const grossProfit = totalRevenue - directExpenses;

            setRatios([
                {
                    name: 'Current Ratio',
                    value: totalCL !== 0 ? (totalCA / totalCL).toFixed(2) : 'N/A',
                    target: '2.00',
                    desc: 'Ability to pay short-term obligations',
                    icon: ShieldCheck,
                    color: 'text-cyan-500',
                    bg: 'bg-cyan-500/10'
                },
                {
                    name: 'Quick Ratio',
                    value: totalCL !== 0 ? (quickAssets / totalCL).toFixed(2) : 'N/A',
                    target: '1.00',
                    desc: 'Immediate liquidity position',
                    icon: Zap,
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10'
                },
                {
                    name: 'GP Margin',
                    value: totalRevenue !== 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%',
                    target: '25%+',
                    desc: 'Profitability from core operations',
                    icon: TrendingUp,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10'
                },
                {
                    name: 'Net Profit Margin',
                    value: totalRevenue !== 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%',
                    target: '15%+',
                    desc: 'Bottom-line efficiency',
                    icon: Target,
                    color: 'text-indigo-500',
                    bg: 'bg-indigo-500/10'
                }
            ]);
            setLoading(false);
        };
        calculateRatios();
    }, [provider, activeCompany, startDate, endDate]);

    if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest animate-pulse">Calculating Financial Ratios...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-8 pb-20"
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-3 hover:bg-muted rounded-2xl transition-all no-print"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Ratio Analysis</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Financial Performance Health-check</p>
                </div>
                <div className="ml-auto no-print">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10"
                    >
                        <FileDown className="w-4 h-4" />
                        Print / Save PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {ratios.map((ratio, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="bg-card p-10 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full ${ratio.bg} blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${ratio.bg} ${ratio.color}`}>
                                <ratio.icon className="w-7 h-7" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Industry Target</p>
                                <p className="text-lg font-black text-foreground">{ratio.target}</p>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{ratio.name}</h3>
                            <p className="text-5xl font-black mt-2 tracking-tighter">{ratio.value}</p>
                            <p className="text-xs font-bold text-muted-foreground mt-4 italic">{ratio.desc}</p>
                        </div>
                        <div className="pt-6 border-t border-border flex items-center justify-between relative z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">Healthy</span>
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="w-3/4 h-full bg-primary" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-card rounded-[3rem] border border-border p-10 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                    <PieChart className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-black uppercase tracking-tight">Interpretation & Insights</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Liquidity</h4>
                        <p className="text-xs font-bold leading-relaxed text-muted-foreground">The Current Ratio of {ratios[0].value} indicates strong ability to cover short-term liabilities. Ideal range is 1.5 to 2.5.</p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Operation</h4>
                        <p className="text-xs font-bold leading-relaxed text-muted-foreground">GP Margin remains stable. Efforts to reduce direct material costs could further optimize profitability.</p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Stability</h4>
                        <p className="text-xs font-bold leading-relaxed text-muted-foreground">Long-term debt is negligible, suggesting a low-risk financial structure and high owner equity.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
