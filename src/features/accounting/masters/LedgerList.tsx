import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePersistence } from '../../../services/persistence/PersistenceContext';

interface Ledger {
    id: string;
    name: string;
    group: string;
    balance: number;
    type: 'Dr' | 'Cr';
}

export default function LedgerList() {
    const { provider, activeCompany } = usePersistence();
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLedgers = async () => {
            if (provider && activeCompany) {
                try {
                    const data = await provider.read<Ledger[]>('ledgers.json', activeCompany.path);
                    setLedgers(data || []);
                } catch (error) {
                    console.error('Failed to load ledgers:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchLedgers();
    }, [provider, activeCompany]);

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-6xl mx-auto"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Chart of Accounts</h1>
                    <p className="text-muted-foreground font-medium">Manage ledgers and groups for {activeCompany?.name}</p>
                </div>
                <Link
                    to="/ledgers/new"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Ledger</span>
                </Link>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Find an account..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-background rounded-xl border border-input transition-all">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {ledgers.length === 0 ? (
                        <div className="p-16 text-center space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">No accounts found</h3>
                                <p className="text-muted-foreground text-sm">Start by creating your first ledger account.</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] border-b border-border">
                                <tr>
                                    <th className="px-8 py-4">Account Name</th>
                                    <th className="px-8 py-4">Group</th>
                                    <th className="px-8 py-4 text-right">Balance</th>
                                    <th className="px-8 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {ledgers.map((ledger) => (
                                    <tr key={ledger.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-8 py-4 font-bold text-foreground">{ledger.name}</td>
                                        <td className="px-8 py-4 font-medium text-muted-foreground">
                                            <span className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-bold uppercase tracking-wider">
                                                {ledger.group}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right font-mono font-bold">
                                            <span className={ledger.type === 'Cr' ? 'text-rose-500' : 'text-cyan-500'}>
                                                {ledger.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {ledger.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
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
