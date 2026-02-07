import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { type Ledger, LedgerReportCalculator, type LedgerReportData } from '../../services/accounting/ReportService';
import { type Voucher } from '../../services/accounting/VoucherService';
import { FileDown, Wallet } from 'lucide-react';


interface LedgerReportProps {
    externalSelectedLedgerId?: string;
    onLedgerChange?: (ledgerId: string) => void;
    isEmbedded?: boolean;
}

export default function LedgerReport({ externalSelectedLedgerId, onLedgerChange, isEmbedded }: LedgerReportProps) {
    const { provider, activeCompany } = usePersistence();
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [selectedLedgerId, setSelectedLedgerId] = useState<string>(externalSelectedLedgerId || '');
    const [reportData, setReportData] = useState<LedgerReportData | null>(null);
    const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
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
                    vouchers as any[],
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



    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-7xl mx-auto pb-12"
        >
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="space-y-4 flex-1 no-print">
                    {!isEmbedded && (
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                                <Wallet className="w-6 h-6 text-primary" />
                                Ledger Vouchers
                            </h1>
                            <p className="text-muted-foreground text-sm font-medium">Transaction history & running balance</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Select Ledger</label>
                            <select
                                value={selectedLedgerId}
                                onChange={(e) => {
                                    setSelectedLedgerId(e.target.value);
                                    if (onLedgerChange) onLedgerChange(e.target.value);
                                }}
                                className="w-full p-2.5 rounded-xl bg-muted/50 border border-border font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                {ledgers.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-muted/50 border border-border font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-muted/50 border border-border font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={() => window.print()}
                        disabled={!reportData}
                        className="no-print flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                    >
                        <FileDown className="w-4 h-4" />
                        Print / Save PDF
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : reportData ? (
                    <div className="flex flex-col h-full">
                        {/* Summary Header */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-muted/30 border-b border-border">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Opening Balance</span>
                                <div className="font-mono font-bold text-lg text-foreground">
                                    {reportData.openingBalance.toLocaleString()} <span className="text-xs text-muted-foreground">{reportData.openingBalanceType}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Debits</span>
                                <div className="font-mono font-bold text-lg text-foreground">
                                    {reportData.totalDebit.toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Credits</span>
                                <div className="font-mono font-bold text-lg text-foreground">
                                    {reportData.totalCredit.toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Closing Balance</span>
                                <div className={`font-mono font-bold text-lg ${reportData.closingBalanceType === 'Dr' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {reportData.closingBalance.toLocaleString()} <span className="text-xs">{reportData.closingBalanceType}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 w-1/3">Particulars</th>
                                        <th className="px-6 py-4">Vch Type</th>
                                        <th className="px-6 py-4 text-right">Debit</th>
                                        <th className="px-6 py-4 text-right">Credit</th>
                                        <th className="px-6 py-4 text-right">Balance</th>
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
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-medium">
                                                No transactions found in this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportData.rows.map((row, idx) => (
                                            <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-3 font-medium text-foreground whitespace-nowrap">
                                                    {new Date(row.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-foreground/80 group-hover:text-primary transition-colors cursor-pointer">
                                                    {row.particulars}
                                                </td>
                                                <td className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    {row.voucherType} <span className="text-foreground/50">#{row.voucherNo}</span>
                                                </td>
                                                <td className="px-6 py-3 font-mono text-right font-medium">
                                                    {row.debit > 0 ? row.debit.toLocaleString() : '-'}
                                                </td>
                                                <td className="px-6 py-3 font-mono text-right font-medium">
                                                    {row.credit > 0 ? row.credit.toLocaleString() : '-'}
                                                </td>
                                                <td className="px-6 py-3 font-mono text-right font-bold text-foreground">
                                                    {row.balance.toLocaleString()} <span className="text-[10px] text-muted-foreground">{row.balanceType}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {/* Footer Total Row */}
                                    <tr className="bg-muted/20 font-black border-t-2 border-border text-foreground">
                                        <td className="px-6 py-4" colSpan={3}>Total</td>
                                        <td className="px-6 py-4 font-mono text-right">{reportData.totalDebit.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-mono text-right">{reportData.totalCredit.toLocaleString()}</td>
                                        <td className="px-6 py-4"></td>
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
