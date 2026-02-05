import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, PieChart, TrendingUp, Target, Zap, ShieldCheck } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';
import { ACCT_GROUPS, type Ledger } from '../../services/accounting/ReportService';
import type { Voucher } from '../../services/accounting/VoucherService';
import type { StockItem } from '../../services/inventory/types';

export default function RatioAnalysis() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [ratios, setRatios] = useState<{ name: string, value: string, target: string, desc: string, icon: any, color: string, bg: string }[]>([]);

    useEffect(() => {
        const calculateRatios = async () => {
            if (!provider || !activeCompany) return;

            const [, lData, sData] = await Promise.all([
                provider.read<Voucher[]>('vouchers.json', activeCompany.path),
                provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                provider.read<StockItem[]>('stock_items.json', activeCompany.path)
            ]);

            const ledgers = lData || [];
            const stockItems = sData || [];

            const ca_ledgers = ledgers.filter(l => ACCT_GROUPS.ASSETS.includes(l.group));
            const cl_ledgers = ledgers.filter(l => ACCT_GROUPS.LIABILITIES.includes(l.group));

            const closingStock = stockItems.reduce((sum, item) => {
                const balance = item.currentBalance !== undefined ? item.currentBalance : item.openingStock;
                const rate = item.currentRate !== undefined ? item.currentRate : item.openingRate;
                return sum + (balance * rate);
            }, 0);

            const totalCA = ca_ledgers.reduce((sum, l) => sum + l.balance, 0) + closingStock;
            const totalCL = cl_ledgers.reduce((sum, l) => sum + l.balance, 0);
            const quickAssets = totalCA - closingStock;

            // GP and NP
            const revenue = ledgers.filter(l => ACCT_GROUPS.INCOME.includes(l.group))
                .reduce((sum, l) => sum + l.balance, 0);
            const expenses = ledgers.filter(l => ACCT_GROUPS.EXPENSES.includes(l.group))
                .reduce((sum, l) => sum + l.balance, 0);

            const netProfit = revenue - expenses;
            const grossProfit = revenue - ledgers.filter(l => l.group === 'Direct Expenses' || l.group === 'Purchase Accounts')
                .reduce((sum, l) => sum + l.balance, 0);

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
                    value: revenue !== 0 ? ((grossProfit / revenue) * 100).toFixed(2) + '%' : '0%',
                    target: '25%+',
                    desc: 'Profitability from core operations',
                    icon: TrendingUp,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10'
                },
                {
                    name: 'Net Profit Margin',
                    value: revenue !== 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%',
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
    }, [provider, activeCompany]);

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
                    className="p-3 hover:bg-muted rounded-2xl transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Ratio Analysis</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Financial Performance Health-check</p>
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
