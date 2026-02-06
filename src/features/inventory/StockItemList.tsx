import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { StockItem, UnitOfMeasure } from '../../services/inventory/types';

export default function StockItemList() {
    const { provider, activeCompany } = usePersistence();
    const [items, setItems] = useState<StockItem[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (provider && activeCompany) {
                try {
                    const itemData = await provider.read<StockItem[]>('stock_items.json', activeCompany.path);
                    const unitData = await provider.read<UnitOfMeasure[]>('units.json', activeCompany.path);
                    setItems(itemData || []);
                    setUnits(unitData || []);
                } catch (error) {
                    console.error('Failed to load stock data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [provider, activeCompany]);

    const getUnitName = (unitId: string) => {
        return units.find(u => u.id === unitId)?.name || 'Unit';
    };

    const handleDelete = async (id: string) => {
        if (!provider || !activeCompany) return;
        if (!confirm('Are you sure you want to delete this stock item?')) return;

        try {
            const updated = items.filter(i => i.id !== id);
            await provider.write('stock_items.json', updated, activeCompany.path);
            setItems(updated);
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    if (loading) return <div className="p-12 text-center text-muted-foreground">Loading Inventory...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-6xl mx-auto"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Inventory Items</h1>
                    <p className="text-muted-foreground font-medium">Manage your product catalog and stock levels.</p>
                </div>
                <Link
                    to="/inventory/items/new"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Item</span>
                </Link>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Find a product..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {items.length === 0 ? (
                        <div className="p-16 text-center space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
                                <Box className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">No items found</h3>
                                <p className="text-muted-foreground text-sm">Start building your product database.</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] border-b border-border">
                                <tr>
                                    <th className="px-4 py-2">Product Name</th>
                                    <th className="px-4 py-2">Group</th>
                                    <th className="px-4 py-2">Opening Stock</th>
                                    <th className="px-4 py-2">Valuation</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-4 py-2">
                                            <div>
                                                <p className="font-bold text-foreground text-lg">{item.name}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.sku || 'No SKU'}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                {item.groupId || 'Primary'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <p className="font-mono font-bold text-foreground">
                                                {item.openingStock.toLocaleString()} {getUnitName(item.unitId)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground font-medium italic">
                                                @ {item.openingRate.toLocaleString()} / {getUnitName(item.unitId)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="w-fit bg-primary/5 border border-primary/10 rounded-xl px-4 py-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-1">Total Value</p>
                                                <p className="font-mono font-black text-primary text-lg leading-none">
                                                    {item.openingValue.toLocaleString('en-IN', { style: 'currency', currency: activeCompany?.currency || 'INR' })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <Link
                                                    to={`/inventory/items/${item.id}`}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
