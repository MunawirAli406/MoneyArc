import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { FileDown, Search, Trash2, Edit2, FileText } from 'lucide-react';
import type { Voucher } from '../../services/accounting/VoucherService';
import { VoucherService } from '../../services/accounting/VoucherService';
import { useNavigate } from 'react-router-dom';
import { useReportDates } from './DateContext';
import LedgerQuickView from './LedgerQuickView';
import PeriodSelector from '../../components/ui/PeriodSelector';
import Select from '../../components/ui/Select';

export default function Daybook() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);

    const { startDate, endDate } = useReportDates();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;
            setLoading(true);
            try {
                const data = await provider.read<Voucher[]>('vouchers.json', activeCompany.path);
                setVouchers(data || []);
            } catch (e) {
                console.error("Failed to load vouchers", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    useEffect(() => {
        let result = vouchers;

        // Date Filter
        result = result.filter(v => v.date >= startDate && v.date <= endDate);

        // Type Filter
        if (typeFilter !== 'ALL') {
            result = result.filter(v => v.type === typeFilter);
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(v =>
                v.voucherNo.toLowerCase().includes(query) ||
                (v.narration && v.narration.toLowerCase().includes(query)) ||
                v.rows.some(r => r.account.toLowerCase().includes(query))
            );
        }

        // Sort by Date Descending
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setFilteredVouchers(result);
    }, [vouchers, startDate, endDate, typeFilter, searchQuery]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this voucher? This will reverse all ledger impacts.')) return;
        if (!provider || !activeCompany) return;

        try {
            await VoucherService.deleteVoucher(provider, id, activeCompany.path);
            setVouchers(vouchers.filter(v => v.id !== id));
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (e) {
            alert('Failed to delete voucher');
            console.error(e);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} vouchers?`)) return;
        if (!provider || !activeCompany) return;

        try {
            for (const id of Array.from(selectedIds)) {
                await VoucherService.deleteVoucher(provider, id, activeCompany.path);
            }
            setVouchers(vouchers.filter(v => !selectedIds.has(v.id)));
            setSelectedIds(new Set());
        } catch (e) {
            alert('Bulk delete partially failed');
            console.error(e);
        }
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredVouchers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredVouchers.map(v => v.id)));
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-7xl mx-auto pb-12"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Daybook Ledger</h1>
                    <p className="text-muted-foreground font-medium">Daily transaction register: {activeCompany?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10"
                    >
                        <FileText className="w-4 h-4" />
                        Print / Save PDF
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] p-4 border border-border/50 dark:border-white/10 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by Voucher No, Ledger, or Narration..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-muted/20 rounded-2xl border-none outline-none font-black text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 transition-all"
                    />
                </div>
                <div className="w-full md:w-auto min-w-[240px]">
                    <Select
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                            { value: 'ALL', label: 'All Vouchers', icon: FileText },
                            { value: 'Sales', label: 'Sales', icon: FileText },
                            { value: 'Purchase', label: 'Purchase', icon: FileText },
                            { value: 'Payment', label: 'Payment', icon: FileText },
                            { value: 'Receipt', label: 'Receipt', icon: FileText },
                            { value: 'Contra', label: 'Contra', icon: FileText },
                            { value: 'Journal', label: 'Journal', icon: FileText },
                        ]}
                        className="w-full"
                    />
                </div>
                <button
                    onClick={() => {
                        const headers = ["Date", "Type", "Vch No", "Particulars", "Amount"];
                        const csvContent = [
                            headers.join(","),
                            ...filteredVouchers.map(v => {
                                const totalAmt = v.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0);
                                const mainLedger = v.rows.find(r => r.type === (v.type === 'Receipt' || v.type === 'Purchase' ? 'Cr' : 'Dr'))?.account || 'Multiple';
                                return [v.date, v.type, v.voucherNo, `"${mainLedger}"`, totalAmt].join(",");
                            })
                        ].join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Daybook_${startDate}.csv`;
                        a.click();
                    }}
                    className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500/20 transition-all active:scale-95"
                    title="Export CSV"
                >
                    <FileDown className="w-5 h-5" />
                </button>
            </div>

            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between no-print"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-primary text-primary-foreground w-10 h-10 rounded-xl flex items-center justify-center font-black">
                                {selectedIds.size}
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight">Bulk Actions</h4>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Applying to selected entries</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-6 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                            >
                                <Trash2 className="w-4 h-4" /> Delete All
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-card rounded-[2.5rem] shadow-2xl border border-border/50 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border">
                                <th className="px-8 py-5 w-16">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === filteredVouchers.length && filteredVouchers.length > 0}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                    />
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-40">Date</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Type & Number</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Particulars</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right w-48">Net Amount</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            <AnimatePresence mode="popLayout">
                                {filteredVouchers.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-muted/30 rounded-full text-muted-foreground/30">
                                                    <FileText className="w-12 h-12" />
                                                </div>
                                                <p className="text-lg font-black text-muted-foreground/50 uppercase tracking-widest">Empty Registry</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    filteredVouchers.map((v, idx) => {
                                        const totalAmt = v.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0);
                                        const mainLedger = v.rows.find(r => r.type === (v.type === 'Receipt' || v.type === 'Purchase' ? 'Cr' : 'Dr'))?.account || 'Multiple';

                                        return (
                                            <motion.tr
                                                key={v.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="hover:bg-muted/5 transition-colors group"
                                            >
                                                <td className="px-8 py-6">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(v.id)}
                                                        onChange={() => toggleSelection(v.id)}
                                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                                    />
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="font-mono font-black text-base text-foreground/80">{new Date(v.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${v.type === 'Sales' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                            v.type === 'Purchase' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                                                v.type === 'Payment' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                                                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                            }`}>
                                                            {v.type}
                                                        </div>
                                                        <span className="font-mono font-black text-foreground">{v.voucherNo}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <LedgerQuickView ledgerName={mainLedger}>
                                                        <div className="font-black text-base text-foreground tracking-tight group-hover:text-primary transition-colors underline decoration-dotted decoration-primary/30 underline-offset-4">{mainLedger}</div>
                                                    </LedgerQuickView>
                                                    {v.narration && (
                                                        <p className="text-xs font-bold text-muted-foreground/60 italic truncate max-w-sm mt-1">{v.narration}</p>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right font-mono font-black text-lg text-foreground">
                                                    ₹{totalAmt.toLocaleString()}
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <button
                                                            onClick={() => navigate(`/vouchers/edit/${v.id}`)}
                                                            className="p-3 hover:bg-primary/10 text-primary rounded-xl transition-all"
                                                            title="Modify Transaction"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(v.id)}
                                                            className="p-3 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all"
                                                            title="Void Transaction"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div >
    );
}
