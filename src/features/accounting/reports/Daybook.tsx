import { useState, useEffect } from 'react';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { ExportService } from '../../../services/reports/ExportService';
import { VoucherService, type Voucher } from '../../../services/accounting/VoucherService';
import { Calendar, FileDown, Printer, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceModal from '../vouchers/InvoiceModal';
import type { Ledger } from '../../../services/accounting/ReportService';
import { useNavigate } from 'react-router-dom';

export default function Daybook() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) {
                setLoading(false);
                return;
            }

            try {
                const [vData, lData] = await Promise.all([
                    provider.read<Voucher[]>('vouchers.json', activeCompany.path),
                    provider.read<Ledger[]>('ledgers.json', activeCompany.path)
                ]);

                const sorted = (vData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setVouchers(sorted);
                setLedgers(lData || []);
            } catch (err) {
                console.error("Failed to load Daybook data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    const handleExport = () => {
        const rows = vouchers.map(v => {
            const amount = v.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0);
            return [
                new Date(v.date).toLocaleDateString(),
                v.rows[0]?.account || 'Journal Entry',
                `${v.type} #${v.voucherNo}`,
                amount.toFixed(2),
                amount.toFixed(2)
            ];
        });
        ExportService.exportToPDF('Daybook', ['Date', 'Particulars', 'Voucher', 'Debit', 'Credit'], rows, activeCompany);
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
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Daybook</h1>
                    <p className="text-muted-foreground font-medium">Chronological record of transactions for {activeCompany?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-2.5 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        <FileDown className="w-4 h-4" />
                        Export PDF
                    </button>
                    <div className="relative group">
                        <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] border-b border-border">
                            <tr>
                                <th className="px-8 py-4">Date / Period</th>
                                <th className="px-8 py-4">Particulars & Narration</th>
                                <th className="px-8 py-4">Voucher Info</th>
                                <th className="px-8 py-4 text-right">Debit Balance</th>
                                <th className="px-8 py-4 text-right">Credit Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {vouchers.map((v) => {
                                const amount = v.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0);

                                return (
                                    <tr key={v.id} className="hover:bg-muted/10 transition-colors cursor-pointer group">
                                        <td className="px-8 py-5">
                                            <div className="text-foreground font-bold">{new Date(v.date).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Authorized</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-foreground group-hover:text-primary transition-colors">{v.rows[0]?.account || 'Journal Entry'}</div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1 line-clamp-1">{v.narration || 'No narrative provided'}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {v.type} #{v.voucherNo}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono font-bold text-foreground">{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-8 py-5 text-right font-mono font-bold text-foreground">
                                            <div className="flex items-center justify-end gap-2">
                                                <span>{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-4">
                                                    {v.type === 'Sales' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedVoucher(v);
                                                            }}
                                                            className="p-2 hover:bg-primary/10 text-primary rounded-lg"
                                                            title="Print Invoice"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/vouchers/edit/${v.id}`);
                                                        }}
                                                        className="p-2 hover:bg-indigo-500/10 text-indigo-500 rounded-lg"
                                                        title="Edit Voucher"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (confirm("Are you sure you want to delete this voucher? This will reverse all ledger and inventory impacts.")) {
                                                                try {
                                                                    await VoucherService.deleteVoucher(provider!, v.id, activeCompany!.path);
                                                                    setVouchers(prev => prev.filter(item => item.id !== v.id));
                                                                } catch (err) {
                                                                    alert("Failed to delete voucher.");
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg"
                                                        title="Delete Voucher"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {vouchers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
                                            <Calendar className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">No transactions found</h3>
                                            <p className="text-muted-foreground text-sm">We couldn't find any vouchers for the selected period.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedVoucher && activeCompany && (
                    <InvoiceModal
                        voucher={selectedVoucher}
                        company={activeCompany}
                        customer={ledgers.find(l => l.name === selectedVoucher.rows.find(r => r.type === 'Dr')?.account) || { name: 'Cash', gstin: '', address: '', balance: 0, type: 'Dr', id: 'cash', group: 'Cash-in-hand', isGstEnabled: false }}
                        onClose={() => setSelectedVoucher(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
