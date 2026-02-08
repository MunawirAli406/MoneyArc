import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { StockItem, UnitOfMeasure } from '../../services/inventory/types';
import type { Voucher } from '../../services/accounting/VoucherService';
import { Package, FileDown } from 'lucide-react';
import { ExportService } from '../../services/reports/ExportService';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

interface StockVoucherProps {
    externalSelectedItemId?: string;
    onItemChange?: (itemId: string) => void;
    isEmbedded?: boolean;
}

interface StockTransactionRow {
    date: string;
    voucherNo: string;
    voucherType: string;
    particulars: string;
    inwardQty: number;
    outwardQty: number;
    balance: number;
    rate: number;
    value: number;
}

export default function StockVoucher({ externalSelectedItemId, onItemChange, isEmbedded }: StockVoucherProps) {
    const { provider, activeCompany } = usePersistence();
    const [items, setItems] = useState<StockItem[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string>(externalSelectedItemId || '');
    const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<StockTransactionRow[]>([]);
    const [openingQty, setOpeningQty] = useState(0);
    const [totalInward, setTotalInward] = useState(0);
    const [totalOutward, setTotalOutward] = useState(0);

    // Initial Data Load
    useEffect(() => {
        const load = async () => {
            if (!provider || !activeCompany) return;
            const [itemData, unitData] = await Promise.all([
                provider.read<StockItem[]>('stock_items.json', activeCompany.path),
                provider.read<UnitOfMeasure[]>('units.json', activeCompany.path)
            ]);
            setItems(itemData || []);
            setUnits(unitData || []);

            if (!externalSelectedItemId && itemData && itemData.length > 0 && !selectedItemId) {
                setSelectedItemId(itemData[0].id);
            }
        };
        load();
    }, [provider, activeCompany, externalSelectedItemId]);

    // Sync external ID
    useEffect(() => {
        if (externalSelectedItemId) setSelectedItemId(externalSelectedItemId);
    }, [externalSelectedItemId]);

    // Calculate Stock Register
    useEffect(() => {
        const calculateRegister = async () => {
            if (!provider || !activeCompany || !selectedItemId) return;
            setLoading(true);

            const vouchers = await provider.read<Voucher[]>('vouchers.json', activeCompany.path) || [];
            const item = items.find(i => i.id === selectedItemId);
            if (!item) {
                setLoading(false);
                return;
            }

            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();

            // 1. Filter vouchers containing this item
            const itemVouchers = vouchers.filter(v =>
                v.rows.some(r => r.inventoryAllocations?.some(a => a.itemId === selectedItemId))
            );
            itemVouchers.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // 2. Calculate Opening Balance for the period
            // Start with item's Opening Stock from master
            let runningQty = item.openingStock;

            // Add all transactions BEFORE startDate
            itemVouchers.forEach(v => {
                if (new Date(v.date).getTime() < start) {
                    v.rows.forEach(r => {
                        r.inventoryAllocations?.forEach(a => {
                            if (a.itemId === selectedItemId) {
                                if (v.type === 'Purchase') runningQty += a.quantity;
                                else if (v.type === 'Sales') runningQty -= a.quantity;
                            }
                        });
                    });
                }
            });

            const opQty = runningQty;
            setOpeningQty(opQty);

            // 3. Build rows for the period
            const rows: StockTransactionRow[] = [];
            let inQtyTotal = 0;
            let outQtyTotal = 0;

            itemVouchers.forEach(v => {
                const vTime = new Date(v.date).getTime();
                if (vTime >= start && vTime <= end) {
                    v.rows.forEach(r => {
                        r.inventoryAllocations?.forEach(a => {
                            if (a.itemId === selectedItemId) {
                                const inQty = v.type === 'Purchase' ? a.quantity : 0;
                                const outQty = v.type === 'Sales' ? a.quantity : 0;

                                runningQty += (inQty - outQty);
                                inQtyTotal += inQty;
                                outQtyTotal += outQty;

                                // Particulars logic: find the other ledger in this voucher
                                const mainRow = v.rows.find(row => row.id !== r.id && row.account !== '');
                                const particulars = mainRow ? mainRow.account : 'As per Details';

                                rows.push({
                                    date: v.date,
                                    voucherNo: v.voucherNo,
                                    voucherType: v.type,
                                    particulars,
                                    inwardQty: inQty,
                                    outwardQty: outQty,
                                    balance: runningQty,
                                    rate: a.rate,
                                    value: a.amount
                                });
                            }
                        });
                    });
                }
            });

            setTransactions(rows);
            setTotalInward(inQtyTotal);
            setTotalOutward(outQtyTotal);
            setLoading(false);
        };

        const timer = setTimeout(calculateRegister, 100);
        return () => clearTimeout(timer);
    }, [selectedItemId, startDate, endDate, items, provider, activeCompany]);

    const getUnitName = (id?: string) => units.find(u => u.id === id)?.name || 'Units';
    const selectedItem = items.find(i => i.id === selectedItemId);

    const handleExport = () => {
        if (!selectedItem) return;
        const rows = [
            ['From:', startDate, 'To:', endDate],
            ['Opening Balance:', openingQty.toString(), '', ''],
            ['Date', 'Particulars', 'Vch Type', 'Inwards', 'Outwards', 'Balance'],
            ...transactions.map(t => [
                new Date(t.date).toLocaleDateString(),
                t.particulars,
                `${t.voucherType} #${t.voucherNo}`,
                t.inwardQty > 0 ? t.inwardQty.toString() : '',
                t.outwardQty > 0 ? t.outwardQty.toString() : '',
                t.balance.toString()
            ]),
            ['Total', '', '', totalInward.toString(), totalOutward.toString(), (openingQty + totalInward - totalOutward).toString()]
        ];
        ExportService.exportToPDF(`Stock Register - ${selectedItem.name}`, [], rows, activeCompany);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-7xl mx-auto pb-12"
        >
            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="space-y-4 flex-1">
                    {!isEmbedded && (
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                                <Package className="w-6 h-6 text-primary" />
                                Stock Register
                            </h1>
                            <p className="text-muted-foreground text-sm font-medium">Monthly item-wise movement & valuation</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Select Item</label>
                            <Select
                                value={selectedItemId}
                                onChange={(val) => {
                                    setSelectedItemId(val);
                                    if (onItemChange) onItemChange(val);
                                }}
                                options={items.map(i => ({
                                    value: i.id,
                                    label: i.name,
                                    icon: Package
                                }))}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-1">
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={setStartDate}
                            />
                        </div>
                        <div className="space-y-1">
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={setEndDate}
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={transactions.length === 0 && openingQty === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-50"
                >
                    <FileDown className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            {/* Content */}
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : selectedItem ? (
                    <div className="flex flex-col">
                        {/* Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-muted/10 border-b border-border">
                            <div className="space-y-1 p-4 rounded-2xl bg-card border border-border shadow-sm">
                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Opening Qty</span>
                                <div className="font-mono font-bold text-lg text-foreground">
                                    {openingQty.toLocaleString()} <span className="text-xs text-muted-foreground">{getUnitName(selectedItem.unitId)}</span>
                                </div>
                            </div>
                            <div className="space-y-1 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 shadow-sm text-emerald-600">
                                <span className="text-[10px] uppercase font-black opacity-70 tracking-widest">Inwards (+)</span>
                                <div className="font-mono font-bold text-lg">
                                    {totalInward.toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-1 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 shadow-sm text-rose-600">
                                <span className="text-[10px] uppercase font-black opacity-70 tracking-widest">Outwards (-)</span>
                                <div className="font-mono font-bold text-lg">
                                    {totalOutward.toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-1 p-4 rounded-2xl bg-primary/5 border border-primary/20 shadow-sm amber-glow">
                                <span className="text-[10px] uppercase font-black text-primary tracking-widest">Closing Balance</span>
                                <div className="font-mono font-bold text-lg text-primary">
                                    {(openingQty + totalInward - totalOutward).toLocaleString()} <span className="text-xs text-muted-foreground">{getUnitName(selectedItem.unitId)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 w-1/4">Particulars</th>
                                        <th className="px-6 py-4">Vch Details</th>
                                        <th className="px-6 py-4 text-right">Inward (Qty)</th>
                                        <th className="px-6 py-4 text-right">Outward (Qty)</th>
                                        <th className="px-6 py-4 text-right">Running (Qty)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {openingQty !== 0 && (
                                        <tr className="bg-muted/10 italic text-muted-foreground">
                                            <td className="px-6 py-3">{new Date(startDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-3" colSpan={4}>Opening Balance</td>
                                            <td className="px-6 py-3 font-mono font-bold text-right">{openingQty.toLocaleString()}</td>
                                        </tr>
                                    )}

                                    {transactions.map((t, idx) => (
                                        <tr key={idx} className="group hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-3 font-medium whitespace-nowrap">
                                                {new Date(t.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3 font-bold group-hover:text-primary transition-colors cursor-pointer">
                                                {t.particulars}
                                            </td>
                                            <td className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">
                                                {t.voucherType} <span className="opacity-50">#{t.voucherNo}</span>
                                            </td>
                                            <td className="px-6 py-3 font-mono text-right text-emerald-600 font-bold">
                                                {t.inwardQty > 0 ? t.inwardQty.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-right text-rose-600 font-bold">
                                                {t.outwardQty > 0 ? t.outwardQty.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-right font-black text-foreground">
                                                {t.balance.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}

                                    {transactions.length === 0 && openingQty === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground italic">
                                                No transactions found for this item in the selected period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-muted/30 border-t-2 border-border font-black">
                                    <tr>
                                        <td className="px-6 py-4" colSpan={3}>Total Period Movement</td>
                                        <td className="px-6 py-4 text-right text-emerald-600">{totalInward.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-rose-600">{totalOutward.toLocaleString()}</td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-96 text-muted-foreground font-medium italic">
                        Select an item to view its movement history
                    </div>
                )}
            </div>
        </motion.div>
    );
}
