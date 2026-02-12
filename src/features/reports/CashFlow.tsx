import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Landmark, FileDown, Wallet } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import PeriodSelector from '../../components/ui/PeriodSelector';
import { useReportDates } from './DateContext';
import { useLocalization } from '../../hooks/useLocalization';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import type { Voucher } from '../../services/accounting/VoucherService';

export default function CashFlow() {
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

    // Simple Cash Flow Logic:
    // Operating: Sales, Purchase, Expenses
    // Investing: Fixed Assets
    // Financing: Loans, Capital

    let operating = 0;
    let investing = 0;
    let financing = 0;

    filteredVouchers.forEach((v: Voucher) => {
        v.rows.forEach(r => {
            const acc = r.account.toLowerCase();
            const amount = r.debit - r.credit; // Positive for inflow (Dr), Negative for outflow (Cr)

            if (acc.includes('cash') || acc.includes('bank')) {
                // We track the counterpart of cash/bank to categorize
                return;
            }

            // Categorization based on simplified keywords
            if (acc.includes('sales') || acc.includes('purchase') || acc.includes('expense')) {
                operating -= amount; // Inverse of the counterpart
            } else if (acc.includes('asset') || acc.includes('machine') || acc.includes('furniture')) {
                investing -= amount;
            } else if (acc.includes('capital') || acc.includes('loan') || acc.includes('drawing')) {
                financing -= amount;
            } else {
                operating -= amount; // Default to operating for simplicity
            }
        });
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Tracing Liquidity Paths...</p>
        </div>
    );

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

    const sparkData = [
        { v: 10 }, { v: 25 }, { v: 15 }, { v: 35 }, { v: 20 }, { v: 45 }
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
                    <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.9] bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                        Cash Flow
                    </h1>
                    <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                        Executive Liquidity Analysis // {activeCompany?.name}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 no-print">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 group"
                    >
                        <FileDown className="w-4 h-4 group-hover:animate-bounce" />
                        Export Treasury Data
                    </button>
                    <div className="glass-panel px-8 py-4 rounded-[2rem] border-primary/10 shadow-2xl flex flex-col items-end group">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Net Cash Delta</p>
                        <p className="text-2xl font-black text-primary tracking-tighter tabular-nums">
                            {formatCurrency(operating + investing + financing)}
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Operating Yield', value: operating, icon: TrendingUp, color: 'google-green' },
                    { label: 'Investment Outlay', value: investing, icon: Landmark, color: 'indigo' },
                    { label: 'Financing Flow', value: financing, icon: Wallet, color: 'amber' },
                ].map((act, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className="glass-panel p-10 rounded-[3rem] border-primary/5 group hover:border-primary/20 transition-all shadow-2xl relative overflow-hidden flex flex-col justify-between h-80"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                        <div>
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 bg-muted/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all border border-border/50">
                                    <act.icon className="w-7 h-7 text-primary" />
                                </div>
                                <div className="h-10 w-24">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sparkData}>
                                            <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">{act.label}</p>
                            <p className="text-4xl font-black text-foreground tracking-tighter tabular-nums mb-4">{formatCurrency(act.value)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {act.value >= 0 ? (
                                <div className="flex items-center gap-2 px-3 py-1 bg-google-green/10 border border-google-green/20 rounded-full text-[9px] font-black text-google-green uppercase tracking-widest">
                                    <TrendingUp className="w-3 h-3" /> Net Inflow
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-black text-rose-600 uppercase tracking-widest">
                                    <TrendingDown className="w-3 h-3" /> Net Outflow
                                </div>
                            )}
                            <div className="flex-1 h-px bg-border/40" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div variants={item} className="glass-panel rounded-[3.5rem] border-primary/10 overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">Statutory Cash Flow Matrix</h2>
                    <div className="px-4 py-1.5 bg-primary/10 rounded-full text-[9px] font-black text-primary uppercase tracking-widest border border-primary/20">Executive Review</div>
                </div>
                <div className="p-12 space-y-12">
                    {[
                        { id: 'A', name: 'Operating Activities', val: operating, desc: 'Summarizes cash generated from core business operations including sales, inventory, and operational expenses.' },
                        { id: 'B', name: 'Investing Activities', val: investing, desc: 'Tracks cash flows related to purchasing or selling long-term assets like equipment, furniture, and investments.' },
                        { id: 'C', name: 'Financing Activities', val: financing, desc: 'Reports cash movement between the business and its owners or creditors, such as capital infusions or loan repayments.' }
                    ].map((sec, i) => (
                        <div key={i} className="space-y-6 group/sec">
                            <div className="flex justify-between items-end border-b border-border/80 pb-4 group-hover/sec:border-primary/30 transition-colors">
                                <h3 className="font-black text-sm uppercase tracking-[0.2em] text-primary flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs">{sec.id}</span>
                                    {sec.name}
                                </h3>
                                <span className="font-black text-xl text-foreground tabular-nums tracking-tighter">{formatCurrency(sec.val)}</span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-3xl opacity-60 group-hover/sec:opacity-100 transition-opacity">{sec.desc}</p>
                        </div>
                    ))}

                    <div className="mt-16 p-12 bg-primary text-primary-foreground rounded-[3rem] shadow-2xl relative overflow-hidden group/summary">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        <motion.div
                            initial={{ x: -100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 0.05 }}
                            className="absolute right-10 top-1/2 -translate-y-1/2 text-[120px] font-black select-none pointer-events-none"
                        >
                            CASH
                        </motion.div>
                        <div className="flex flex-col md:flex-row justify-between items-center relative">
                            <div>
                                <h4 className="text-3xl font-black tracking-tighter uppercase mb-2">Net Treasury Variance</h4>
                                <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.4em]">Consolidated Algorithmized Result (A + B + C)</p>
                            </div>
                            <div className="text-center md:text-right mt-8 md:mt-0">
                                <p className="text-6xl font-black tracking-tighter tabular-nums mb-2">{formatCurrency(operating + investing + financing)}</p>
                                <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">Verified Liquidity Asset</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
