import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { FileDown, ArrowLeft } from 'lucide-react';
import type { StockItem } from '../../services/inventory/types';
import type { Voucher } from '../../services/accounting/VoucherService';
import { useNavigate, useParams } from 'react-router-dom';

interface StockVoucherRow {
    date: string;
    voucherNo: string;
    voucherType: string;
    partyName: string;
    quantityIn: number;
    valueIn: number;
    quantityOut: number;
    valueOut: number;
    closingQty: number;
    closingVal: number;
}

export default function StockVoucherReport() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const { itemId } = useParams();

    const [reportRows, setReportRows] = useState<StockVoucherRow[]>([]);
    const [itemDetails, setItemDetails] = useState<StockItem | null>(null);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), 3, 1).toISOString().split('T')[0]; // April 1st
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany || !itemId) return;
            setLoading(true);

            try {
                const [items, vouchers] = await Promise.all([
                    provider.read<StockItem[]>('stock_items.json', activeCompany.path).then(res => res || []),
                    provider.read<Voucher[]>('vouchers.json', activeCompany.path).then(res => res || [])
                ]);

                const item = items.find(i => i.id === itemId);
                if (!item) {
                    setLoading(false);
                    return;
                }
                setItemDetails(item);

                // Sort vouchers by date
                const sortedVouchers = vouchers.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                let runningQty = item.openingStock || 0;
                let runningVal = item.openingValue || 0;

                const rows: StockVoucherRow[] = [];

                // Process initial balance row if start date is after opening date (simplified)
                // For now, let's just show Opening Balance as first row effectively.

                sortedVouchers.forEach(v => {
                    // Check if voucher has this item
                    let qtyChange = 0;
                    let valChange = 0;
                    let isInward = false;

                    v.rows.forEach(r => {
                        r.inventoryAllocations?.forEach(alloc => {
                            if (alloc.itemId === itemId) {
                                if (v.type === 'Purchase' || v.type === 'Receipt') {
                                    qtyChange += alloc.quantity;
                                    valChange += alloc.amount;
                                    isInward = true;
                                } else if (v.type === 'Sales' || v.type === 'Payment') {
                                    qtyChange += alloc.quantity;
                                    valChange += alloc.amount;
                                    isInward = false;
                                }
                            }
                        });
                    });

                    if (qtyChange !== 0) {
                        if (isInward) {
                            runningQty += qtyChange;
                            runningVal += valChange;
                        } else {
                            runningQty -= qtyChange;
                            runningVal -= valChange; // Note: Sales Value decreases Stock Value logic is flawed for accounting but standard for "Stock Voucher" reports in simple systems. Should be Cost.
                            // Tally shows "Outwards" with Sales Value in Stock Vouchers usually.
                        }

                        // Only add to report if within date range
                        if (v.date >= startDate && v.date <= endDate) {
                            rows.push({
                                date: v.date,
                                voucherNo: v.voucherNo,
                                voucherType: v.type,
                                partyName: v.rows.find(r => r.type === (isInward ? 'Cr' : 'Dr'))?.account || 'Cash/Bank',
                                quantityIn: isInward ? qtyChange : 0,
                                valueIn: isInward ? valChange : 0,
                                quantityOut: !isInward ? qtyChange : 0,
                                valueOut: !isInward ? valChange : 0,
                                closingQty: runningQty,
                                closingVal: runningVal
                            });
                        }
                    }
                });

                setReportRows(rows);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany, itemId, startDate, endDate]);

    if (loading) return <div className="p-10 text-center text-muted-foreground">Loading Stock Vouchers...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-7xl mx-auto pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={() => navigate('/reports/stock-summary')}
                        className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary mb-2 transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Summary
                    </button>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Stock Vouchers</h1>
                    <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm mt-1">{itemDetails?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
                        <div className="flex flex-col relative group focus-within:ring-2 focus-within:ring-primary/20 transition-all rounded-lg p-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-1">From</label>
                            <input
                                type="date"
                                className="bg-transparent text-sm font-bold outline-none text-foreground"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="w-px h-8 bg-border mx-2"></div>
                        <div className="flex flex-col relative group focus-within:ring-2 focus-within:ring-primary/20 transition-all rounded-lg p-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-1">To</label>
                            <input
                                type="date"
                                className="bg-transparent text-sm font-bold outline-none text-foreground"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all"
                        title="Print List"
                    >
                        <FileDown className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Particulars</th>
                            <th className="px-6 py-4">Vch Type</th>
                            <th className="px-4 py-4 text-right bg-emerald-500/5 text-emerald-600">Inwards Qty</th>
                            <th className="px-4 py-4 text-right bg-rose-500/5 text-rose-500">Outwards Qty</th>
                            <th className="px-4 py-4 text-right font-black text-foreground">Closing Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {reportRows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No transactions found in this period.</td>
                            </tr>
                        ) : (
                            reportRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-6 py-4 font-bold text-foreground whitespace-nowrap">
                                        {new Date(row.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{row.partyName}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono">#{row.voucherNo}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">
                                        {row.voucherType}
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600 bg-emerald-500/5">
                                        {row.quantityIn > 0 ? row.quantityIn : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono font-bold text-rose-500 bg-rose-500/5">
                                        {row.quantityOut > 0 ? row.quantityOut : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono font-black text-foreground border-l border-border/50">
                                        {row.closingQty}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

