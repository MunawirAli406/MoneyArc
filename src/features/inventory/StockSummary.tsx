import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { StockItem, StockGroup, UnitOfMeasure } from '../../services/inventory/types';
import { Package, Search, ArrowUpRight, FileDown } from 'lucide-react';
import { ExportService } from '../../services/reports/ExportService';

export default function StockSummary() {
    const { provider, activeCompany } = usePersistence();
    const [items, setItems] = useState<StockItem[]>([]);
    const [groups, setGroups] = useState<StockGroup[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;
            try {
                const [itemData, groupData, unitData] = await Promise.all([
                    provider.read<StockItem[]>('stock_items.json', activeCompany.path),
                    provider.read<StockGroup[]>('stock_groups.json', activeCompany.path),
                    provider.read<UnitOfMeasure[]>('units.json', activeCompany.path)
                ]);

                setItems(itemData || []);
                setGroups(groupData || []);
                setUnits(unitData || []);
            } catch (e) {
                console.error("Failed to load inventory data", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'Units';
    const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || 'Primary';

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalValue = filteredItems.reduce((sum, item) => sum + (item.currentValue || item.openingValue || 0), 0);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Stock Summary</h1>
                    <p className="text-muted-foreground font-medium">Inventory status and valuation for {activeCompany?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const data = filteredItems.map(i => [
                                i.name,
                                getGroupName(i.groupId),
                                (i.currentBalance ?? i.openingStock).toString(),
                                getUnitName(i.unitId),
                                (i.currentRate ?? i.openingRate).toFixed(2),
                                (i.currentValue ?? i.openingValue).toFixed(2)
                            ]);
                            ExportService.exportToPDF('Stock Summary', ['Item Name', 'Group', 'Qty', 'Unit', 'Rate', 'Value'], data, activeCompany);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all"
                    >
                        <FileDown className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Items</p>
                        <p className="text-2xl font-black text-foreground">{filteredItems.length}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                        <ArrowUpRight className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stock Valuation</p>
                        <p className="text-2xl font-black text-foreground">₹{totalValue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-[2.5rem] shadow-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted/30 text-left border-b border-border">
                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Item Details</th>
                                <th className="px-4 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Group</th>
                                <th className="px-4 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Closing Quantity</th>
                                <th className="px-4 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Avg Rate</th>
                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredItems.map((item) => {
                                const qty = item.currentBalance ?? item.openingStock;
                                const rate = item.currentRate ?? item.openingRate;
                                const val = item.currentValue ?? item.openingValue;

                                return (
                                    <tr key={item.id} className="group hover:bg-muted/10 transition-colors">
                                        <td className="px-8 py-5">
                                            <div>
                                                <p className="font-black text-foreground text-sm uppercase tracking-tight">{item.name}</p>
                                                {item.sku && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.sku}</p>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                {getGroupName(item.groupId)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 text-right font-mono font-bold text-sm">
                                            <span className={qty < (item.reorderLevel || 0) ? 'text-rose-500' : 'text-foreground'}>
                                                {qty} {getUnitName(item.unitId)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 text-right font-mono text-muted-foreground text-sm">
                                            {rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono font-black text-primary text-sm">
                                            {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-muted-foreground font-medium italic">
                                        No items found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-muted/30">
                            <tr className="border-t-2 border-primary/20">
                                <td colSpan={4} className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-right">Grand Total</td>
                                <td className="px-8 py-6 text-right font-mono font-black text-xl text-primary">₹{totalValue.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
