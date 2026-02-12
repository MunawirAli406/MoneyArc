import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, TrendingDown, FileDown, ShieldCheck } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { TaxService } from '../../services/accounting/TaxService';
import type { Voucher } from '../../services/accounting/VoucherService';
import type { Ledger } from '../../services/accounting/ReportService';
import { useReportDates } from './DateContext';
import PeriodSelector from '../../components/ui/PeriodSelector';
import { useLocalization } from '../../hooks/useLocalization';

export default function Gstr3bReport() {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency, tax } = useLocalization();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate } = useReportDates();

    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                const [vData, lData] = await Promise.all([
                    provider.read<Voucher[]>('vouchers.json', activeCompany.path),
                    provider.read<Ledger[]>('ledgers.json', activeCompany.path)
                ]);
                setVouchers(vData || []);
                setLedgers(lData || []);
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    const filteredVouchers = vouchers.filter((v: Voucher) => v.date >= startDate && v.date <= endDate);

    const salesVouchers = filteredVouchers.filter((v: Voucher) => v.type === 'Sales');
    const purchaseVouchers = filteredVouchers.filter((v: Voucher) => v.type === 'Purchase');

    const outwardSummary = TaxService.aggregateSummaries(salesVouchers, ledgers);
    const inwardSummary = TaxService.aggregateSummaries(purchaseVouchers, ledgers);

    const totalOutputTax = outwardSummary.totalTax;
    const totalInputTax = inwardSummary.totalTax;
    const netTaxPayable = Math.max(0, totalOutputTax - totalInputTax);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Aggregating Statutory Data...</p>
        </div>
    );

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

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
                        {tax.summaryLabel}
                    </h1>
                    <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                        Summary of Outward & Inward Supplies // {activeCompany?.name}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 no-print">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 group"
                    >
                        <FileDown className="w-4 h-4 group-hover:animate-bounce" />
                        Export Archive
                    </button>
                    <div className="glass-panel px-8 py-4 rounded-[2rem] border-primary/10 shadow-2xl flex items-center gap-6 group">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Net Payability</p>
                            <p className="text-2xl font-black text-primary tracking-tighter tabular-nums">{formatCurrency(netTaxPayable)}</p>
                        </div>
                        <div className="w-px h-10 bg-border/50" />
                        <div className="w-10 h-10 rounded-full bg-google-green/10 flex items-center justify-center border border-google-green/20">
                            <ShieldCheck className="w-5 h-5 text-google-green" />
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: tax.outwardTaxLabel, value: totalOutputTax, icon: TrendingUp, color: 'rose' },
                    { label: tax.itcLabel, value: totalInputTax, icon: TrendingDown, color: 'google-green' },
                    { label: 'Net Liability', value: netTaxPayable, icon: Calculator, color: 'amber' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className="glass-panel p-8 rounded-[2.5rem] border-primary/5 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                        <div className="w-12 h-12 bg-muted/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors border border-border/50">
                            <stat.icon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                        <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{formatCurrency(stat.value)}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={item} className="glass-panel rounded-[3.5rem] border-primary/10 overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-border/50 bg-muted/20">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">Outward Supplies Detail</h2>
                    </div>
                    <div className="p-10 space-y-6">
                        {[
                            { label: tax.labels.taxable, value: outwardSummary.taxableValue },
                            { label: 'IGST', value: outwardSummary.igst },
                            { label: 'CGST', value: outwardSummary.cgst },
                            { label: 'SGST', value: outwardSummary.sgst },
                            { label: 'Cess', value: outwardSummary.cess },
                        ].map((row, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0 group/row">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover/row:text-primary transition-colors">{row.label}</span>
                                <span className="text-lg font-black text-foreground tabular-nums tracking-tighter">{formatCurrency(row.value)}</span>
                            </div>
                        ))}
                        <div className="mt-8 pt-8 border-t-2 border-primary/20 flex justify-between items-center">
                            <span className="text-[12px] font-black text-primary uppercase tracking-[0.3em]">Total Output Liability</span>
                            <span className="text-2xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(totalOutputTax)}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={item} className="glass-panel rounded-[3.5rem] border-primary/10 overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-border/50 bg-muted/20">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">Inward Supplies (ITC Claims)</h2>
                    </div>
                    <div className="p-10 space-y-6">
                        {[
                            { label: tax.labels.taxable, value: inwardSummary.taxableValue },
                            { label: 'IGST', value: inwardSummary.igst },
                            { label: 'CGST', value: inwardSummary.cgst },
                            { label: 'SGST', value: inwardSummary.sgst },
                            { label: 'Cess', value: inwardSummary.cess },
                        ].map((row, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0 group/row">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover/row:text-primary transition-colors">{row.label}</span>
                                <span className="text-lg font-black text-foreground tabular-nums tracking-tighter">{formatCurrency(row.value)}</span>
                            </div>
                        ))}
                        <div className="mt-8 pt-8 border-t-2 border-primary/20 flex justify-between items-center">
                            <span className="text-[12px] font-black text-primary uppercase tracking-[0.3em]">Total Eligible Credits</span>
                            <span className="text-2xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(totalInputTax)}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
