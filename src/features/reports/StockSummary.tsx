import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { FileDown, Search, Package, FileText } from 'lucide-react';
import type { StockItem, UnitOfMeasure } from '../../services/inventory/types';
import type { Voucher } from '../../services/accounting/VoucherService';
import { useNavigate } from 'react-router-dom';
import PeriodSelector from '../../components/ui/PeriodSelector';

interface StockSummaryRow {
    itemId: string;
    itemName: string;
    unit: string;
    openingQty: number;
    openingVal: number;
    inwardQty: number;
    inwardVal: number;
    outwardQty: number;
    outwardVal: number;
    closingQty: number;
    closingVal: number;
}

export default function StockSummary() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [summary, setSummary] = useState<StockSummaryRow[]>([]);
    const [loading, setLoading] = useState(true);


    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), 3, 1).toISOString().split('T')[0]; // April 1st
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;
            setLoading(true);

            try {
                const [items, units, vouchers] = await Promise.all([
                    provider.read<StockItem[]>('stock_items.json', activeCompany.path).then(res => res || []),
                    provider.read<UnitOfMeasure[]>('units.json', activeCompany.path).then(res => res || []),
                    provider.read<Voucher[]>('vouchers.json', activeCompany.path).then(res => res || [])
                ]);

                // Filter Vouchers by Date Range
                const periodVouchers = vouchers.filter(v => v.date >= startDate && v.date <= endDate);

                // Calculate Summary
                const report: StockSummaryRow[] = items.map(item => {
                    const unitName = units.find(u => u.id === item.unitId)?.name || '';

                    // 1. Opening Balance (Logic: Item Opening + Transactions BEFORE StartDate)
                    // For simplicity in V1, we will assume "Opening" as per Item Master for now, 
                    // OR strictly calculate from Day 1 if we had a full transaction history from scratch.
                    // Ideally: Effective Opening = Master Opening + All tx < startDate.
                    // Let's implement that for accuracy.

                    const prePeriodVouchers = vouchers.filter(v => v.date < startDate);

                    let effectiveOpeningQty = item.openingStock || 0;
                    let effectiveOpeningVal = item.openingValue || 0;

                    prePeriodVouchers.forEach(v => {
                        v.rows.forEach(r => {
                            r.inventoryAllocations?.forEach(alloc => {
                                if (alloc.itemId === item.id) {
                                    if (v.type === 'Purchase' || v.type === 'Receipt') { // Inward
                                        effectiveOpeningQty += alloc.quantity;
                                        effectiveOpeningVal += alloc.amount;
                                    } else if (v.type === 'Sales' || v.type === 'Payment') { // Outward
                                        effectiveOpeningQty -= alloc.quantity;
                                        effectiveOpeningVal -= alloc.amount;
                                    }
                                }
                            });
                        });
                    });

                    // 2. Period Movements
                    let inwardQty = 0;
                    let inwardVal = 0;
                    let outwardQty = 0;
                    let outwardVal = 0;

                    periodVouchers.forEach(v => {
                        v.rows.forEach(r => {
                            r.inventoryAllocations?.forEach(alloc => {
                                if (alloc.itemId === item.id) {
                                    if (v.type === 'Purchase' || v.type === 'Receipt') { // Inward
                                        inwardQty += alloc.quantity;
                                        inwardVal += alloc.amount;
                                    } else if (v.type === 'Sales' || v.type === 'Payment') { // Outward
                                        outwardQty += alloc.quantity;
                                        outwardVal += alloc.amount;
                                    }
                                }
                            });
                        });
                    });

                    // 3. Closing
                    const closingQty = effectiveOpeningQty + inwardQty - outwardQty;
                    // Valuation logic usually FIFO or Weighted Avg. 
                    // Simple logic: Opening Val + Inward Val - Outward Val.
                    // This creates issues if Outward Val is calculated at Sales Price (Profit included).
                    // Stock Value should be at Cost.
                    // Tally Logic: Closing Value = Closing Qty * Weighted Avg Cost.
                    // We need a robust weighted avg rate calculator.

                    // Simplified for now:
                    // We will use the 'currentValue' from Item Master if date is today, 
                    // but since we are filtering by date, we need to be careful.

                    // better approach for display:
                    // Closing Value = effectiveOpeningVal + inwardVal - (outwardQty * AvgCost)
                    // Where AvgCost = (effectiveOpeningVal + inwardVal) / (effectiveOpeningQty + inwardQty)

                    const totalInputQty = effectiveOpeningQty + inwardQty;
                    const totalInputVal = effectiveOpeningVal + inwardVal;
                    const avgRate = totalInputQty > 0 ? totalInputVal / totalInputQty : 0;

                    const costOfGoodsSold = outwardQty * avgRate;
                    const closingVal = totalInputVal - costOfGoodsSold;

                    return {
                        itemId: item.id,
                        itemName: item.name,
                        unit: unitName,
                        openingQty: effectiveOpeningQty,
                        openingVal: effectiveOpeningVal,
                        inwardQty,
                        inwardVal,
                        outwardQty,
                        outwardVal: outwardVal, // This is Sales Value (Revenue), not Cost. 
                        // Actually Stock Summary usually shows Inwards (Purchase) and Outwards (Sales) figures as recorded.
                        // And Closing Balance is derived.
                        // Let's stick to showing recorded values for In/Out, but Closing Value must be Cost-based.
                        closingQty,
                        closingVal: closingVal
                    };
                });

                setSummary(report);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany, startDate, endDate]);

    // Filtering
    const filteredSummary = summary.filter(item =>
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (item.openingQty !== 0 || item.inwardQty !== 0 || item.outwardQty !== 0)
    );

    const totalClosingVal = filteredSummary.reduce((sum, item) => sum + item.closingVal, 0);

    if (loading) return <div className="p-10 text-center text-muted-foreground">Loading Stock Summary...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-7xl mx-auto pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Stock Summary</h1>
                    <p className="text-muted-foreground font-medium">Inventory Position ({new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()})</p>
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
                    <button
                        onClick={() => {
                            const headers = ["Item Name", "Opening Qty", "Opening Val", "Inward Qty", "Inward Val", "Outward Qty", "Outward Val", "Closing Qty", "Closing Val"];
                            const csvContent = [
                                headers.join(","),
                                ...filteredSummary.map(item => [
                                    `"${item.itemName}"`,
                                    item.openingQty,
                                    item.openingVal,
                                    item.inwardQty,
                                    item.inwardVal,
                                    item.outwardQty,
                                    item.outwardVal,
                                    item.closingQty,
                                    item.closingVal
                                ].join(","))
                            ].join("\n");

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement("a");
                            if (link.download !== undefined) {
                                const url = URL.createObjectURL(blob);
                                link.setAttribute("href", url);
                                link.setAttribute("download", `StockSummary_${startDate}_${endDate}.csv`);
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        }}
                        className="p-3 bg-card border border-border rounded-xl hover:shadow-lg transition-all text-muted-foreground hover:text-emerald-500"
                        title="Export CSV"
                    >
                        <FileDown className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg transition-all"
                        title="Print List"
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-3xl border border-border">
                <Search className="w-5 h-5 text-muted-foreground ml-2" />
                <input
                    type="text"
                    placeholder="Search Stock Items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none font-bold text-sm"
                />
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] border-b border-border">
                        <tr>
                            <th className="px-6 py-4 w-1/4">Item Name</th>
                            <th className="px-4 py-4 text-right bg-muted/30">Opening Balance</th>
                            <th className="px-4 py-4 text-right">Inwards</th>
                            <th className="px-4 py-4 text-right bg-muted/30">Outwards</th>
                            <th className="px-4 py-4 text-right font-black text-foreground">Closing Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredSummary.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No stock data available.</td>
                            </tr>
                        ) : (
                            filteredSummary.map(item => (
                                <tr
                                    key={item.itemId}
                                    className="hover:bg-muted/10 transition-colors cursor-pointer group"
                                    onClick={() => navigate(`/reports/stock-voucher/${item.itemId}`)}
                                >
                                    <td className="px-6 py-4 font-bold text-foreground">
                                        <div className="flex items-center gap-3">
                                            <Package className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            {item.itemName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono bg-muted/10 group-hover:bg-muted/20">
                                        <div className="font-bold text-muted-foreground">{item.openingQty} {item.unit}</div>
                                        <div className="text-[10px] text-muted-foreground opacity-70">₹{item.openingVal.toLocaleString()}</div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono">
                                        <div className="font-bold text-emerald-600">{item.inwardQty > 0 ? `+${item.inwardQty}` : '-'}</div>
                                        {item.inwardVal > 0 && <div className="text-[10px] text-muted-foreground">₹{item.inwardVal.toLocaleString()}</div>}
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono bg-muted/10 group-hover:bg-muted/20">
                                        <div className="font-bold text-rose-500">{item.outwardQty > 0 ? `-${item.outwardQty}` : '-'}</div>
                                        {item.outwardVal > 0 && <div className="text-[10px] text-muted-foreground">₹{item.outwardVal.toLocaleString()}</div>}
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono border-l border-border/50">
                                        <div className="font-black text-foreground">{item.closingQty} {item.unit}</div>
                                        <div className="text-xs font-bold text-primary">₹{item.closingVal.toLocaleString()}</div>
                                    </td>
                                </tr>
                            ))
                        )}
                        <tr className="bg-muted border-t-2 border-border">
                            <td className="px-6 py-4 font-black text-foreground uppercase tracking-widest text-[10px]">Grand Total</td>
                            <td colSpan={3}></td>
                            <td className="px-4 py-4 text-right font-black font-mono text-lg text-primary">₹{totalClosingVal.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

