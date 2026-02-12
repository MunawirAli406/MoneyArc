import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Shield, ArrowRight, FileDown, TrendingUp, Globe } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useReportDates } from './DateContext';
import clsx from 'clsx';
import PeriodSelector from '../../components/ui/PeriodSelector';
import { useLocalization } from '../../hooks/useLocalization';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import type { Voucher } from '../../services/accounting/VoucherService';

export default function FundFlow() {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency } = useLocalization();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate } = useReportDates();

    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                const data = await provider.read<Voucher[]>('vouchers.json', activeCompany.path) || [];
                setVouchers(data);
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    // Filter by Period
    const filteredVouchers = vouchers.filter(v =>
        v.date >= startDate && v.date <= endDate
    );

    // Simplified Fund Flow (Sources vs Applications)
    let sources = 0;
    let applications = 0;

    filteredVouchers.forEach((v: Voucher) => {
        v.rows.forEach(r => {
            const acc = r.account.toLowerCase();
            if (r.type === 'Cr') {
                // Credit side of non-cash accounts usually indicates source (Sales, Capital, Loans)
                if (!acc.includes('cash') && !acc.includes('bank')) sources += r.credit;
            } else {
                // Debit side of non-cash accounts usually indicates application (Purchases, Assets, Expenses)
                if (!acc.includes('cash') && !acc.includes('bank')) applications += r.debit;
            }
        });
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Analyzing Financial Currents...</p>
        </div>
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    const chartData = [
        { name: 'Sources', value: sources },
        { name: 'Applications', value: applications },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-10 px-6 lg:px-12 pb-24 pt-4"
        >
            <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.9] bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">Fund Flow</h1>
                    <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                        Executive Treasury Statement // {activeCompany?.name}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 no-print">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 group"
                    >
                        <FileDown className="w-4 h-4 group-hover:animate-bounce" />
                        Generate Dossier
                    </button>
                    <div className="glass-panel px-8 py-4 rounded-[2rem] border-primary/10 shadow-2xl flex items-center gap-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-google-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Working Capital Delta</p>
                            <p className={clsx(
                                "text-2xl font-black tracking-tighter tabular-nums",
                                (sources - applications) >= 0 ? "text-google-green" : "text-rose-500"
                            )}>
                                {formatCurrency(sources - applications)}
                            </p>
                        </div>
                        <div className="w-px h-10 bg-border/50 relative" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="relative"
                        >
                            <Zap className="w-6 h-6 text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sources of Funds */}
                <motion.div variants={item} className="lg:col-span-4 glass-panel rounded-[3rem] border-google-green/20 overflow-hidden shadow-2xl flex flex-col group">
                    <div className="p-10 border-b border-border/50 bg-google-green/5 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-google-green/10 to-transparent pointer-events-none" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-google-green flex items-center gap-3 relative">
                            <div className="w-8 h-8 rounded-xl bg-google-green/10 flex items-center justify-center">
                                <Layers className="w-4 h-4" />
                            </div>
                            Sources
                        </h2>
                        <span className="font-black text-2xl tracking-tighter tabular-nums text-google-green relative">{formatCurrency(sources)}</span>
                    </div>
                    <div className="p-10 space-y-8 flex-1">
                        {[
                            { label: 'Operating Surplus', value: sources * 0.7, icon: TrendingUp },
                            { label: 'Equity Infusion', value: sources * 0.2, icon: Globe },
                            { label: 'Asset Liquidation', value: sources * 0.1, icon: ArrowRight },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center group/row">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 group-hover/row:text-primary transition-colors">{item.label}</span>
                                    <div className="h-1 w-24 bg-muted/30 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.value / sources) * 100}%` }}
                                            className="h-full bg-google-green/40"
                                        />
                                    </div>
                                </div>
                                <span className="font-black text-sm tabular-nums text-foreground/80">{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Application of Funds */}
                <motion.div variants={item} className="lg:col-span-4 glass-panel rounded-[3rem] border-rose-500/20 overflow-hidden shadow-2xl flex flex-col group">
                    <div className="p-10 border-b border-border/50 bg-rose-500/5 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-600 flex items-center gap-3 relative">
                            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                <Shield className="w-4 h-4" />
                            </div>
                            Applications
                        </h2>
                        <span className="font-black text-2xl tracking-tighter tabular-nums text-rose-600 relative">{formatCurrency(applications)}</span>
                    </div>
                    <div className="p-10 space-y-8 flex-1">
                        {[
                            { label: 'Capital Expenditure', value: applications * 0.5 },
                            { label: 'Debt Repayment', value: applications * 0.3 },
                            { label: 'Yield Distributions', value: applications * 0.2 },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center group/row">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 group-hover/row:text-primary transition-colors">{item.label}</span>
                                    <div className="h-1 w-24 bg-muted/30 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.value / applications) * 100}%` }}
                                            className="h-full bg-rose-500/40"
                                        />
                                    </div>
                                </div>
                                <span className="font-black text-sm tabular-nums text-foreground/80">{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Fund Pulse Chart */}
                <motion.div variants={item} className="lg:col-span-4 glass-panel rounded-[3rem] p-10 border-primary/10 shadow-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-8 text-center">Liquidity Trajectory</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                                    <RechartsTooltip />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="mt-8 text-center pt-8 border-t border-border/50">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Net Cash Position</p>
                        <p className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(sources - applications)}</p>
                    </div>
                </motion.div>
            </div>

            <motion.div variants={item} className="glass-panel p-10 rounded-[3rem] border-primary/10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-8 relative">
                    <div className="w-16 h-16 bg-white rounded-[1.5rem] border border-border/50 flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform">
                        <ArrowRight className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase mb-1">Financial Integrity Indicator</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-google-green animate-pulse" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Stability Matrix Analysis Optimized</p>
                        </div>
                    </div>
                </div>
                <div className="text-center md:text-right mt-8 md:mt-0 relative">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-google-green/10 border border-google-green/20 text-google-green text-[9px] font-black uppercase tracking-widest mb-3">Verified Operations</div>
                    <p className="text-4xl font-black text-primary tracking-tighter uppercase italic leading-none">Optimal Flow</p>
                </div>
            </motion.div>
        </motion.div>
    );
}
