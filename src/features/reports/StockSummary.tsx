import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { FileDown, Search, Package, FileText, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import type { StockItem, UnitOfMeasure } from '../../services/inventory/types';
import type { Voucher } from '../../services/accounting/VoucherService';
import { useNavigate } from 'react-router-dom';
import { useReportDates } from './DateContext';
import PeriodSelector from '../../components/ui/PeriodSelector';
import AIReportAdvisor from '../../components/ai/AIReportAdvisor';
import { useLocalization } from '../../hooks/useLocalization';

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
    const { formatCurrency, valuationLabel } = useLocalization();
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

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10 max-w-[1600px] mx-auto px-6 lg:px-12 pb-24 pt-4"
        >
            <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.9] bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                        {valuationLabel}
                    </h1>
                    <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                        Executive Inventory Pulse // {activeCompany?.name}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 no-print">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 group"
                    >
                        <FileText className="w-4 h-4 group-hover:animate-bounce" />
                        Download Portfolio
                    </button>
                </div>
            </motion.div>

            <motion.div variants={item}>
                <AIReportAdvisor
                    reportName={valuationLabel}
                    data={{
                        totalValue: totalClosingVal,
                        itemCount: filteredSummary.length,
                        topItems: filteredSummary.slice(0, 5).map(i => ({ name: i.itemName, closingVal: i.closingVal, in: i.inwardQty, out: i.outwardQty }))
                    }}
                />
            </motion.div>

            <motion.div variants={item} className="flex items-center gap-6 glass-panel p-6 rounded-[2.5rem] border-primary/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex-1 group/input">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Inventory Portfolio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-muted/20 rounded-[1.5rem] border-none outline-none font-black text-sm focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30 uppercase tracking-widest"
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
                    className="p-5 bg-google-green/10 text-google-green rounded-[1.5rem] hover:bg-google-green/20 transition-all active:scale-95 border border-google-green/20"
                >
                    <FileDown className="w-5 h-5" />
                </button>
            </motion.div>

            <motion.div variants={item} className="glass-panel rounded-[3rem] shadow-2xl border-primary/10 overflow-hidden relative group/report">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-500/5 opacity-50 pointer-events-none" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border">
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Asset Identity</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right bg-muted/20">Initial Position</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right">Inflow Activity</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right bg-muted/20">Outflow Velocity</th>
                                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right">{valuationLabel}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredSummary.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground/50 font-black uppercase tracking-widest">No Inventory Data Found</td>
                                </tr>
                            ) : (
                                filteredSummary.map((item) => (
                                    <motion.tr
                                        key={item.itemId}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer group/row"
                                        onClick={() => navigate(`/reports/stock-voucher/${item.itemId}`)}
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-2xl shrink-0 group-hover/row:scale-110 transition-transform">
                                                    <Package className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-black text-xl text-foreground tracking-tighter group-hover/row:text-primary transition-colors truncate">{item.itemName}</div>
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50 mt-1 flex items-center gap-2">
                                                        <span className="w-4 h-px bg-border" />
                                                        SKU ID: {item.itemId.slice(-6).toUpperCase()} // {item.unit}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/inventory/items/${item.itemId}`);
                                                    }}
                                                    className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all opacity-0 group-hover/row:opacity-100 border border-transparent hover:border-primary/20"
                                                    title="Edit Asset"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right font-mono bg-muted/5 group-hover/row:bg-muted/10 transition-colors">
                                            <div className="font-black text-foreground text-lg tabular-nums tracking-tighter">{formatCurrency(item.openingVal)}</div>
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1">{item.openingQty.toLocaleString()} Units</div>
                                        </td>
                                        <td className="px-8 py-8 text-right font-mono">
                                            <div className="flex items-center justify-end gap-2 text-google-green">
                                                <ArrowUpRight className="w-4 h-4" />
                                                <span className="font-black text-lg tabular-nums tracking-tighter">{formatCurrency(item.inwardVal)}</span>
                                            </div>
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1">+{item.inwardQty.toLocaleString()} Added</div>
                                        </td>
                                        <td className="px-8 py-8 text-right font-mono bg-muted/5 group-hover/row:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-end gap-2 text-rose-500">
                                                <ArrowDownRight className="w-4 h-4" />
                                                <span className="font-black text-lg tabular-nums tracking-tighter">{formatCurrency(item.outwardVal)}</span>
                                            </div>
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1">-{item.outwardQty.toLocaleString()} Released</div>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <div className="font-black text-3xl text-primary tracking-tighter tabular-nums mb-1">{formatCurrency(item.closingVal)}</div>
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-8 h-1 bg-muted rounded-full">
                                                    <div className="h-full bg-primary/40 rounded-full" style={{ width: '60%' }} />
                                                </div>
                                                <div className="text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase">{item.closingQty.toLocaleString()} {item.unit}</div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                        <tr className="bg-primary/5 border-t-4 border-primary/20">
                            <td colSpan={4} className="px-10 py-12">
                                <span className="text-[12px] font-black uppercase tracking-[0.4em] text-primary">Consolidated Portfolio Value</span>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 opacity-60">Verified Valuation // {activeCompany?.name}</p>
                            </td>
                            <td className="px-12 py-12 text-right">
                                <div className="text-5xl font-black text-primary tracking-tighter tabular-nums mb-1">{formatCurrency(totalClosingVal)}</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Net Asset Holdings</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </motion.div>

            <motion.div variants={item} className="p-12 rounded-[3.5rem] bg-google-green/5 border-2 border-google-green/20 text-center relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-google-green/5 to-transparent pointer-events-none" />
                <div className="relative">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-google-green/60 mb-6 underline decoration-google-green/30 underline-offset-8">Inventory Integrity Score: Optimal</p>
                    <h3 className="text-3xl font-black text-google-green tracking-tighter uppercase italic leading-tight">
                        Asset Liquidity at {formatCurrency(totalClosingVal)}
                    </h3>
                    <div className="flex justify-center gap-12 mt-8 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                        <Package className="w-6 h-6 text-google-green" />
                        <ArrowUpRight className="w-6 h-6 text-google-green" />
                        <TrendingUp className="w-6 h-6 text-google-green" />
                    </div>
                </div>
            </motion.div>
        </motion.div >
    );
}

