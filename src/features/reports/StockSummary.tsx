import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { FileDown, Search, Package, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { StockItem, UnitOfMeasure } from '../../services/inventory/types';
import type { Voucher } from '../../services/accounting/VoucherService';
import { useNavigate } from 'react-router-dom';
import { useReportDates } from './DateContext';
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

    const { startDate, endDate } = useReportDates();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                setLoading(true);

                try {
                    const [items, units, vouchers] = await Promise.all([
                        provider.read<StockItem[]>('stock_items.json', activeCompany.path).then(res => res || []),
                        provider.read<UnitOfMeasure[]>('units.json', activeCompany.path).then(res => res || []),
                        provider.read<Voucher[]>('vouchers.json', activeCompany.path).then(res => res || [])
                    ]);

                    const periodVouchers = vouchers.filter(v => v.date >= startDate && v.date <= endDate);

                    const report: StockSummaryRow[] = items.map(item => {
                        const unitName = units.find(u => u.id === item.unitId)?.name || '';

                        const prePeriodVouchers = vouchers.filter(v => v.date < startDate);

                        let effectiveOpeningQty = item.openingStock || 0;
                        let effectiveOpeningVal = item.openingValue || 0;

                        prePeriodVouchers.forEach(v => {
                            v.rows.forEach(r => {
                                r.inventoryAllocations?.forEach(alloc => {
                                    if (alloc.itemId === item.id) {
                                        if (v.type === 'Purchase' || v.type === 'Receipt') {
                                            effectiveOpeningQty += alloc.quantity;
                                            effectiveOpeningVal += alloc.amount;
                                        } else if (v.type === 'Sales' || v.type === 'Payment') {
                                            effectiveOpeningQty -= alloc.quantity;
                                            effectiveOpeningVal -= alloc.amount;
                                        }
                                    }
                                });
                            });
                        });

                        let inwardQty = 0;
                        let inwardVal = 0;
                        let outwardQty = 0;
                        let outwardVal = 0;

                        periodVouchers.forEach(v => {
                            v.rows.forEach(r => {
                                r.inventoryAllocations?.forEach(alloc => {
                                    if (alloc.itemId === item.id) {
                                        if (v.type === 'Purchase' || v.type === 'Receipt') {
                                            inwardQty += alloc.quantity;
                                            inwardVal += alloc.amount;
                                        } else if (v.type === 'Sales' || v.type === 'Payment') {
                                            outwardQty += alloc.quantity;
                                            outwardVal += alloc.amount;
                                        }
                                    }
                                });
                            });
                        });

                        const closingQty = effectiveOpeningQty + inwardQty - outwardQty;
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
                            outwardVal: outwardVal,
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
            } else {
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany, startDate, endDate]);

    const filteredSummary = summary.filter(item =>
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (item.openingQty !== 0 || item.inwardQty !== 0 || item.outwardQty !== 0 || item.closingQty !== 0)
    );

    const totalClosingVal = filteredSummary.reduce((sum, item) => sum + item.closingVal, 0);

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
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Inventory Valuation</h1>
                    <p className="text-muted-foreground font-medium">Closing stock & movement summary: {activeCompany?.name}</p>
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

            <div className="flex items-center gap-6 bg-card p-6 rounded-[2rem] border border-border/50 dark:border-white/10 shadow-2xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Inventory Items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-muted/20 rounded-[1.25rem] border-none outline-none font-black text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                    />
                </div>
                <button
                    onClick={() => {
                        const headers = ["Item", "Unit", "Opening", "Inwards", "Outwards", "Closing", "Value"];
                        const csv = [headers.join(','), ...filteredSummary.map(i => [i.itemName, i.unit, i.openingQty, i.inwardQty, i.outwardQty, i.closingQty, i.closingVal].join(','))].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click();
                    }}
                    className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500/20 transition-all active:scale-95"
                >
                    <FileDown className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-card rounded-[2.5rem] shadow-2xl border border-border/50 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Product Detail</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right bg-muted/20">Opening Balance</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Inward Activity</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right bg-muted/20">Outward Flow</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Closing Valuation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredSummary.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground/50 font-black uppercase tracking-widest">No Inventory Data Found</td>
                                </tr>
                            ) : (
                                filteredSummary.map((item, idx) => (
                                    <motion.tr
                                        key={item.itemId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="hover:bg-muted/5 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/reports/stock-voucher/${item.itemId}`)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shrink-0">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-black text-base text-foreground tracking-tight group-hover:text-primary transition-colors truncate">{item.itemName}</div>
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Unit: {item.unit}</div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/inventory/items/${item.itemId}`);
                                                    }}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Edit Item"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right font-mono bg-muted/10 group-hover:bg-muted/20">
                                            <div className="font-black text-foreground">{activeCompany?.symbol || '₹'}{item.openingVal.toLocaleString()}</div>
                                            <div className="text-[10px] font-bold text-muted-foreground opacity-50">{item.openingQty.toLocaleString()} {item.unit}</div>
                                        </td>
                                        <td className="px-6 py-6 text-right font-mono">
                                            <div className="flex items-center justify-end gap-1.5 text-emerald-500">
                                                <ArrowUpRight className="w-3 h-3" />
                                                <span className="font-black">{activeCompany?.symbol || '₹'}{item.inwardVal.toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-muted-foreground opacity-50">+{item.inwardQty.toLocaleString()} {item.unit}</div>
                                        </td>
                                        <td className="px-6 py-6 text-right font-mono bg-muted/10 group-hover:bg-muted/20">
                                            <div className="flex items-center justify-end gap-1.5 text-rose-500">
                                                <ArrowDownRight className="w-3 h-3" />
                                                <span className="font-black">{activeCompany?.symbol || '₹'}{item.outwardVal.toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-muted-foreground opacity-50">-{item.outwardQty.toLocaleString()} {item.unit}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="font-black text-xl text-primary tracking-tighter">{activeCompany?.symbol || '₹'}{item.closingVal.toLocaleString()}</div>
                                            <div className="text-xs font-black text-muted-foreground tracking-widest uppercase mt-0.5">{item.closingQty.toLocaleString()} {item.unit}</div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-primary/5 border-t-2 border-primary/20">
                                <td colSpan={4} className="px-8 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-primary">Consolidated Inventory Value</td>
                                <td className="px-8 py-8 text-right">
                                    <div className="text-3xl font-black text-primary tracking-tighter">{activeCompany?.symbol || '₹'}{totalClosingVal.toLocaleString()}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary/60 opacity-60">Net Stock Holdings</div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-emerald-500/5 border-2 border-emerald-500/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600/60 mb-3">Inventory Health</p>
                <h3 className="text-xl font-black text-emerald-600 tracking-tight">Your total inventory is valued at approximately {activeCompany?.symbol || '₹'}{totalClosingVal.toLocaleString()}</h3>
            </div>
        </motion.div >
    );
}

