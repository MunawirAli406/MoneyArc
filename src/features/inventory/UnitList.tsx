import { useState, useEffect } from 'react';
import { Plus, Search, Ruler, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { UnitOfMeasure } from '../../services/inventory/types';

export default function UnitList() {
    const { provider, activeCompany } = usePersistence();
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUnits = async () => {
            if (provider && activeCompany) {
                try {
                    const data = await provider.read<UnitOfMeasure[]>('units.json', activeCompany.path);
                    setUnits(data || []);
                } catch (error) {
                    console.error('Failed to load units:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUnits();
    }, [provider, activeCompany]);

    const handleDelete = async (id: string) => {
        if (!provider || !activeCompany) return;
        if (!confirm('Are you sure you want to delete this unit?')) return;

        try {
            const updated = units.filter(u => u.id !== id);
            await provider.write('units.json', updated, activeCompany.path);
            setUnits(updated);
        } catch (error) {
            console.error('Failed to delete unit:', error);
        }
    };

    if (loading) return <div className="p-12 text-center text-muted-foreground">Loading Units...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-5xl mx-auto"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Units of Measure</h1>
                    <p className="text-muted-foreground font-medium">Define measurement units for your inventory items.</p>
                </div>
                <Link
                    to="/inventory/units/new"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Unit</span>
                </Link>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Find a unit..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {units.length === 0 ? (
                        <div className="p-16 text-center space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
                                <Ruler className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">No units defined</h3>
                                <p className="text-muted-foreground text-sm">Create units like Pcs, Kgs, or Boxes.</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] border-b border-border">
                                <tr>
                                    <th className="px-8 py-4">Symbol</th>
                                    <th className="px-8 py-4">Formal Name</th>
                                    <th className="px-8 py-4">Decimal Places</th>
                                    <th className="px-8 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {units.map((unit) => (
                                    <tr key={unit.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-8 py-4 font-black text-primary uppercase">{unit.name}</td>
                                        <td className="px-8 py-4 font-bold text-foreground">{unit.formalName}</td>
                                        <td className="px-8 py-4 text-muted-foreground font-mono">{unit.decimalPlaces}</td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <Link
                                                    to={`/inventory/units/${unit.id}`}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(unit.id)}
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
