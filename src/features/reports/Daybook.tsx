import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { FileDown, Search, Filter, Trash2, Edit2, FileText } from 'lucide-react';
import type { Voucher } from '../../services/accounting/VoucherService';
import { VoucherService } from '../../services/accounting/VoucherService';
import { useNavigate } from 'react-router-dom';
import PeriodSelector from '../../components/ui/PeriodSelector';

export default function Daybook() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');

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
        } catch (e) {
            alert('Failed to delete voucher');
            console.error(e);
        }
    };

    if (loading) return <div className="p-10 text-center text-muted-foreground">Loading Daybook...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-7xl mx-auto pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Daybook</h1>
                    <p className="text-muted-foreground font-medium">Transaction Register ({new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()})</p>
                </div>
                <div className="flex items-center gap-3">
                    <PeriodSelector
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(s, e) => {
                            setStartDate(s);
                            setEndDate(e);
                        }}
                    />
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-card rounded-3xl p-4 border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search Vch No, Ledger, Narration..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-muted/20 rounded-xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <div className="relative w-full md:w-auto min-w-[200px]">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-3 bg-muted/20 rounded-xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                        <option value="ALL">All Voucher Types</option>
                        <option value="Sales">Sales</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Payment">Payment</option>
                        <option value="Receipt">Receipt</option>
                        <option value="Contra">Contra</option>
                        <option value="Journal">Journal</option>
                    </select>
                </div>
                <button
                    onClick={() => {
                        const headers = ["Date", "Voucher Type", "Voucher No", "Particulars", "Debit Amount", "Credit Amount"];
                        const csvContent = [
                            headers.join(","),
                            ...filteredVouchers.map(v => {
                                const totalAmt = v.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0);
                                const mainLedger = v.rows.find(r => r.type === (v.type === 'Receipt' || v.type === 'Purchase' ? 'Cr' : 'Dr'))?.account || 'Multiple';
                                return [
                                    new Date(v.date).toLocaleDateString(),
                                    v.type,
                                    v.voucherNo,
                                    `"${mainLedger} - ${v.narration || ''}"`,
                                    totalAmt,
                                    totalAmt
                                ].join(",");
                            })
                        ].join("\n");

                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement("a");
                        if (link.download !== undefined) {
                            const url = URL.createObjectURL(blob);
                            link.setAttribute("href", url);
                            link.setAttribute("download", `Daybook_${startDate}_${endDate}.csv`);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }}
                    className="p-3 bg-muted/20 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                    title="Export CSV"
                >
                    <FileDown className="w-5 h-5" />
                </button>
                <button
                    onClick={() => window.print()}
                    className="p-3 bg-muted/20 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                    title="Print List"
                >
                    <FileText className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Vch Type</th>
                            <th className="px-6 py-4">Vch No</th>
                            <th className="px-6 py-4 w-1/3">Particulars</th>
                            <th className="px-6 py-4 text-right">Debit Amount</th>
                            <th className="px-6 py-4 text-right">Credit Amount</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredVouchers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-medium">
                                    No vouchers found for this period.
                                </td>
                            </tr>
                        ) : (
                            filteredVouchers.map(v => {
                                const totalAmt = v.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0);
                                // Determine main party or ledger name for display
                                const mainLedger = v.rows.find(r => r.type === (v.type === 'Receipt' || v.type === 'Purchase' ? 'Cr' : 'Dr'))?.account || 'Multiple';

                                return (
                                    <tr key={v.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-foreground whitespace-nowrap">
                                            {new Date(v.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                            {v.type}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-foreground">
                                            {v.voucherNo}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">{mainLedger}</div>
                                            {v.narration && (
                                                <div className="text-xs text-muted-foreground truncate max-w-xs">{v.narration}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                                            {totalAmt.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                                            {totalAmt.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigate(`/vouchers/${v.id}`)}
                                                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                    title="View/Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(v.id)}
                                                    className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
