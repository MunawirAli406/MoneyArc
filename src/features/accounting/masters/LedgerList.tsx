import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, BookOpen, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import type { Voucher } from '../../../services/accounting/VoucherService';

interface Ledger {
    id: string;
    name: string;
    group: string;
    balance: number;
    type: 'Dr' | 'Cr';
}

interface LedgerListProps {
    onViewTransactions?: (ledgerId: string) => void;
}

export default function LedgerList({ onViewTransactions }: LedgerListProps) {
    const { provider, activeCompany } = usePersistence();
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (provider && activeCompany) {
                try {
                    const [ledgerData, voucherData] = await Promise.all([
                        provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                        provider.read<Voucher[]>('vouchers.json', activeCompany.path)
                    ]);
                    setLedgers(ledgerData || []);
                    setVouchers(voucherData || []);
                } catch (error) {
                    console.error('Failed to load data:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchData();
    }, [provider, activeCompany]);

    const handleDelete = async (id: string) => {
        if (!provider || !activeCompany) return;
        if (!confirm('Are you sure you want to delete this ledger?')) return;

        try {
            const updatedLedgers = ledgers.filter(l => l.id !== id);
            await provider.write('ledgers.json', updatedLedgers, activeCompany.path);
            setLedgers(updatedLedgers);
        } catch (error) {
            console.error('Failed to delete ledger:', error);
            alert('Failed to delete ledger.');
        }
    };

    const getLedgerStats = (ledger: Ledger) => {
        let totalDebit = 0;
        let totalCredit = 0;

        vouchers.forEach(v => {
            v.rows.forEach(r => {
                if (r.account === ledger.name) {
                    if (r.type === 'Dr') totalDebit += r.debit;
                    if (r.type === 'Cr') totalCredit += r.credit;
                }
            });
        });

        // Closing Balance is what is stored in ledger.balance (Current Balance)
        // We need to back-calculate Opening Balance.
        // Formula: Closing = Opening + Dr - Cr (For Dr accounts)
        //          Closing = Opening + Cr - Dr (For Cr accounts)

        // Let's standardise to signed numbers where Dr is +ve and Cr is -ve
        const closingSigned = ledger.type === 'Dr' ? ledger.balance : -ledger.balance;
        const netMovement = totalDebit - totalCredit;

        // Closing = Opening + NetMovement
        // Opening = Closing - NetMovement
        const openingSigned = closingSigned - netMovement;

        const openingBalance = Math.abs(openingSigned);
        const openingType = openingSigned >= 0 ? 'Dr' : 'Cr';

        return {
            openingBalance,
            openingType,
            totalDebit,
            totalCredit,
            closingBalance: ledger.balance,
            closingType: ledger.type
        };
    };

    const filteredLedgers = ledgers.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-[95%] mx-auto"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Chart of Accounts</h1>
                    <p className="text-muted-foreground font-medium">Manage ledgers and groups for {activeCompany?.name}</p>
                </div>
                <Link
                    to="/ledgers/new"
                    className="flex items-center gap-2 bg-google-green text-primary-foreground px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-google-green/20 transition-all active:scale-95"
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                    {filteredLedgers.length === 0 ? (
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
                                    <th className="px-4 py-3 min-w-[200px]">Account Name</th>
                                    <th className="px-4 py-3 min-w-[150px]">Group</th>
                                    <th className="px-4 py-3 text-right min-w-[120px]">Opening Bal</th>
                                    <th className="px-4 py-3 text-right min-w-[120px]">Debit</th>
                                    <th className="px-4 py-3 text-right min-w-[120px]">Credit</th>
                                    <th className="px-4 py-3 text-right min-w-[120px]">Closing Bal</th>
                                    <th className="px-4 py-3 text-center w-[120px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredLedgers.map((ledger) => {
                                    const stats = getLedgerStats(ledger);
                                    return (
                                        <tr key={ledger.id} className="hover:bg-muted/10 transition-colors group">
                                            <td className="px-4 py-3 font-bold text-foreground">{ledger.name}</td>
                                            <td className="px-4 py-3 font-medium text-muted-foreground">
                                                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider">
                                                    {ledger.group}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                                {stats.openingBalance > 0 ? (
                                                    <span className={stats.openingType === 'Cr' ? 'text-rose-500/70' : 'text-emerald-500/70'}>
                                                        {stats.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {stats.openingType}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-foreground/70">
                                                {stats.totalDebit > 0 ? stats.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-foreground/70">
                                                {stats.totalCredit > 0 ? stats.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">
                                                <span className={stats.closingType === 'Cr' ? 'text-rose-500' : 'text-emerald-500'}>
                                                    {stats.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {stats.closingType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    {onViewTransactions && (
                                                        <button
                                                            onClick={() => onViewTransactions(ledger.id)}
                                                            className="p-1.5 text-muted-foreground hover:text-accent-500 hover:bg-accent-500/10 rounded-lg transition-colors"
                                                            title="View Vouchers"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        to={`/ledgers/${ledger.id}`}
                                                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(ledger.id)}
                                                        className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
