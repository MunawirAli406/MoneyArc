import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { type Ledger, LedgerReportCalculator, type LedgerReportData } from '../../services/accounting/ReportService';
import { type Voucher } from '../../services/accounting/VoucherService';
import { FileDown, Wallet, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import PeriodSelector from '../../components/ui/PeriodSelector';
import Select from '../../components/ui/Select';
import { useReportDates } from './DateContext';
import clsx from 'clsx';


import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../../hooks/useLocalization';

interface LedgerReportProps {
    externalSelectedLedgerId?: string;
    onLedgerChange?: (ledgerId: string) => void;
    isEmbedded?: boolean;
}

export default function LedgerReport({ externalSelectedLedgerId, onLedgerChange, isEmbedded }: LedgerReportProps) {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency } = useLocalization();
    const navigate = useNavigate();
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [selectedLedgerId, setSelectedLedgerId] = useState<string>(externalSelectedLedgerId || '');
    const [reportData, setReportData] = useState<LedgerReportData | null>(null);
    const { startDate, endDate } = useReportDates();
    const [loading, setLoading] = useState(false);

    // Load minimal data on mount
    useEffect(() => {
        const init = async () => {
            if (!provider || !activeCompany) return;
            const l = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];
            setLedgers(l.sort((a, b) => a.name.localeCompare(b.name)));
            if (!externalSelectedLedgerId && l.length > 0 && !selectedLedgerId) {
                setSelectedLedgerId(l[0].id);
            }
        };
        init();
    }, [provider, activeCompany, externalSelectedLedgerId]);

    // Sync with external selected ledger ID
    useEffect(() => {
        if (externalSelectedLedgerId) {
            setSelectedLedgerId(externalSelectedLedgerId);
        }
    }, [externalSelectedLedgerId]);

    // Fetch Report Data when filters change
    useEffect(() => {
        const fetchReport = async () => {
            if (!provider || !activeCompany || !selectedLedgerId) return;
            setLoading(true);

            const [ledgerList, voucherList] = await Promise.all([
                provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                provider.read<Voucher[]>('vouchers.json', activeCompany.path)
            ]);

            const targetLedger = ledgerList?.find(l => l.id === selectedLedgerId);
            const vouchers = voucherList || [];

            if (targetLedger) {
                // Map Voucher to SimpleVoucher interface expected by Calculator
                // Actually Calculator expects SimpleVoucher which matches Voucher structure mostly
                const data = LedgerReportCalculator.getLedgerVouchers(
                    targetLedger,
                    vouchers as Voucher[],
                    new Date(startDate),
                    new Date(endDate)
                );
                setReportData(data);
            }
            setLoading(false);
        };

        const timer = setTimeout(fetchReport, 100); // Debounce
        return () => clearTimeout(timer);
    }, [provider, activeCompany, selectedLedgerId, startDate, endDate]);
    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Scanning Ledger Registry...</p>
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
                    {!isEmbedded && (
                        <>
                            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.9] bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                                Ledger Registry
                            </h1>
                            <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                                Comprehensive Transaction Audit // {activeCompany?.name}
                            </div>
                        </>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-4 no-print mt-4 lg:mt-0">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="w-64">
                            <Select
                                value={selectedLedgerId}
                                onChange={(val) => {
                                    setSelectedLedgerId(val);
                                    if (onLedgerChange) onLedgerChange(val);
                                }}
                                options={ledgers.map(l => ({
                                    value: l.id,
                                    label: l.name,
                                    description: l.group,
                                    icon: Wallet
                                }))}
                                className="premium-select"
                            />
                        </div>
                        <PeriodSelector />
                    </div>
                    <button
                        onClick={() => window.print()}
                        disabled={!reportData}
                        className="no-print flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 group disabled:opacity-50"
                    >
                        <FileDown className="w-4 h-4 group-hover:animate-bounce" />
                        Download PDF
                    </button>
                </div>
            </motion.div>

            {/* Report Content */}
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden min-h-[500px]">
                {reportData ? (
                    <div className="flex flex-col h-full">
                        {/* Summary Header */}
                        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-muted/20 border-b border-border/50">
                            {[
                                { label: 'Opening Balance', value: reportData.openingBalance, type: reportData.openingBalanceType, icon: Wallet, color: 'primary' },
                                { label: 'Total Debits', value: reportData.totalDebit, icon: Activity, color: 'google-green' },
                                { label: 'Total Credits', value: reportData.totalCredit, icon: Activity, color: 'rose' },
                                { label: 'Closing Balance', value: reportData.closingBalance, type: reportData.closingBalanceType, icon: ShieldCheck, color: reportData.closingBalanceType === 'Dr' ? 'google-green' : 'rose' },
                            ].map((stat, i) => (
                                <div key={i} className="glass-panel p-6 rounded-3xl border-primary/5 shadow-xl group hover:scale-[1.02] transition-transform">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                    <div className="flex items-end gap-2">
                                        <p className={clsx(
                                            "text-2xl font-black tracking-tighter tabular-nums",
                                            stat.color === 'google-green' ? "text-google-green" : stat.color === 'rose' ? "text-rose-500" : "text-primary"
                                        )}>
                                            {activeCompany?.symbol || '₹'}{stat.value.toLocaleString()}
                                        </p>
                                        {stat.type && <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">{stat.type}</span>}
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border">
                                        <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Registry Entry</th>
                                        <th className="px-8 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground w-1/3">Particulars / Journal Ref</th>
                                        <th className="px-6 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Type</th>
                                        <th className="px-8 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right">Debit</th>
                                        <th className="px-8 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right bg-muted/20">Credit</th>
                                        <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right bg-primary/5">Net Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {/* Opening Balance Row */}
                                    {reportData.openingBalance > 0 && (
                                        <tr className="bg-muted/10 italic text-muted-foreground">
                                            <td className="px-6 py-3 font-medium">{new Date(startDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-3" colSpan={4}>Opening Balance</td>
                                            <td className="px-6 py-3 font-mono font-bold text-right">
                                                {reportData.openingBalance.toLocaleString()} {reportData.openingBalanceType}
                                            </td>
                                        </tr>
                                    )}

                                    {reportData.rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-12 py-32 text-center text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] opacity-50">
                                                Zero transaction volatility detected in this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportData.rows.map((row, idx) => (
                                            <tr
                                                key={idx}
                                                onClick={() => navigate(`/vouchers/edit/${row.id}`)}
                                                className="group/row hover:bg-primary/5 transition-colors cursor-pointer border-b border-border/30 last:border-0"
                                            >
                                                <td className="px-10 py-6">
                                                    <div className="font-black text-sm text-foreground tracking-tighter">{new Date(row.date).toLocaleDateString()}</div>
                                                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-40">Entry ID: {row.id.slice(-8)}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4 group/text">
                                                        <ArrowRight className="w-3 h-3 text-primary/40 group-hover/row:translate-x-1 transition-transform" />
                                                        <span className="text-lg font-black text-foreground tracking-tighter group-hover/row:text-primary transition-colors">
                                                            {row.particulars}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                                    {row.voucherType} <span className="ml-2 text-primary/50">#{row.voucherNo}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-foreground tabular-nums tracking-tighter text-xl">
                                                    {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-muted-foreground tabular-nums tracking-tighter text-xl bg-muted/5 group-hover/row:bg-muted/10 transition-colors">
                                                    {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                                                </td>
                                                <td className="px-12 py-6 text-right font-black text-foreground tabular-nums tracking-tighter text-xl bg-primary/5 group-hover/row:bg-primary/10 transition-colors">
                                                    {formatCurrency(row.balance)} <span className="text-[9px] text-muted-foreground ml-1 uppercase">{row.balanceType}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {/* Footer Total Row */}
                                    <tr className="bg-primary/5 border-t-4 border-primary/20">
                                        <td className="px-10 py-12 text-[14px] font-black uppercase tracking-[0.4em] text-primary" colSpan={3}>Consolidated Audit Ledger Total</td>
                                        <td className="px-8 py-12 text-right font-black text-primary text-3xl tabular-nums tracking-tighter">{formatCurrency(reportData.totalDebit)}</td>
                                        <td className="px-8 py-12 text-right font-black text-primary text-3xl tabular-nums tracking-tighter">{formatCurrency(reportData.totalCredit)}</td>
                                        <td className="px-12 py-12"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                        Select a ledger to view history
                    </div>
                )}
            </div>
        </motion.div>
    );
}
