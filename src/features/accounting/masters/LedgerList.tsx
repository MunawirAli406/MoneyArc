import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, BookOpen, FileText, Sparkles, TrendingUp, TrendingDown, Building2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import type { Voucher } from '../../../services/accounting/VoucherService';
import { ReportService, type Ledger } from '../../../services/accounting/ReportService';

// Ledger interface is imported from ReportService

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
                } catch {
                    console.error('Failed to load data');
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
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase tracking-[-0.02em]">Chart of Accounts</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-google-green animate-pulse" />
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] opacity-70">Node Managed: {activeCompany?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {/* AI Audit Logic */ }}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary/20 transition-all active:scale-95 border border-primary/20 shadow-lg"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI Smart Audit
                    </button>
                    <Link
                        to="/ledgers/new"
                        className="flex items-center gap-2 bg-google-green text-primary-foreground px-6 py-3 rounded-xl border border-google-green/20 font-black uppercase text-xs tracking-widest hover:shadow-xl hover:shadow-google-green/30 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Ledger</span>
                    </Link>
                </div>
            </div>

            {/* Bento Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    {
                        label: 'Aggregate Assets',
                        val: ReportService.calculateTotal(ReportService.getGroupSummary(ledgers, 'ASSETS')),
                        icon: TrendingUp, color: 'text-google-blue', bg: 'bg-google-blue/10'
                    },
                    {
                        label: 'Total Liabilities',
                        val: Math.abs(ReportService.calculateTotal(ReportService.getGroupSummary(ledgers, 'LIABILITIES').filter(g => !['Capital Account', 'Reserves & Surplus'].includes(g.groupName)))),
                        icon: TrendingDown, color: 'text-google-red', bg: 'bg-google-red/10'
                    },
                    {
                        label: 'Shareholder Equity',
                        val: Math.abs(ReportService.calculateTotal(ReportService.getGroupSummary(ledgers, 'LIABILITIES').filter(g => ['Capital Account', 'Reserves & Surplus'].includes(g.groupName)))),
                        icon: Building2, color: 'text-google-green', bg: 'bg-google-green/10'
                    },
                    {
                        label: 'Active Node Accounts',
                        val: ledgers.length,
                        icon: Users,
                        color: 'text-google-yellow',
                        bg: 'bg-google-yellow/10',
                        sub: 'Live'
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass-panel p-8 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden group/stat"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={clsx("p-4 rounded-2xl shadow-lg ring-1 ring-inset ring-white/10", stat.bg, stat.color)}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '85%' }}
                                    className={clsx("h-full", stat.color.replace('text', 'bg'))}
                                />
                            </div>
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-2">{stat.label}</h4>
                        <div className="text-3xl font-black tracking-tighter tabular-nums">
                            {typeof stat.val === 'number' && stat.label !== 'Active Node Accounts' ? `${activeCompany?.symbol || '₹'}${stat.val.toLocaleString()}` : stat.val}
                        </div>
                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover/stat:scale-110 group-hover/stat:rotate-12 transition-all duration-700">
                            <stat.icon size={120} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="glass-panel rounded-[2.5rem] shadow-2xl border-white/10 overflow-hidden relative group/list">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-500/5 opacity-30 pointer-events-none" />
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
                            <thead className="bg-card/40 text-foreground font-black uppercase tracking-[0.1em] text-[10px] border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-5 min-w-[200px]">Node / Account</th>
                                    <th className="px-6 py-5 min-w-[150px]">Classification</th>
                                    <th className="px-6 py-5 text-right min-w-[120px]">Opening Position</th>
                                    <th className="px-6 py-5 text-right min-w-[120px]">Aggregate Debit</th>
                                    <th className="px-6 py-5 text-right min-w-[120px]">Aggregate Credit</th>
                                    <th className="px-6 py-5 text-right min-w-[120px]">Final Settlement</th>
                                    <th className="px-6 py-5 text-center w-[120px]">Management</th>
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
                                                    <span className={stats.openingType === 'Cr' ? 'text-rose-500/70' : 'text-google-green/70'}>
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
                                                <span className={stats.closingType === 'Cr' ? 'text-rose-500' : 'text-google-green'}>
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
