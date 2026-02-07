import { TrendingUp, TrendingDown, DollarSign, Activity, Wallet, FileText, ShieldCheck, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useTheme } from '../../features/settings/useTheme';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Voucher } from '../../services/accounting/VoucherService';
import { ACCT_GROUPS, type Ledger } from '../../services/accounting/ReportService';

export default function Dashboard() {
    const { provider, activeCompany } = usePersistence();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState([
        { label: 'Total Revenue', value: '₹0.00', change: '0%', icon: DollarSign, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        { label: 'Total Expenses', value: '₹0.00', change: '0%', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'Net Profit', value: '₹0.00', change: '0%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Vouchers', value: '0', change: '0', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ]);
    interface ChartData {
        name: string;
        revenue: number;
        expenses: number;
    }
    const [recentVouchers, setRecentVouchers] = useState<Voucher[]>([]);
    const [stockWatch, setStockWatch] = useState<any[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!provider || !activeCompany) return;

            const vouchers = await provider.read<Voucher[]>('vouchers.json', activeCompany.path) || [];
            const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];
            const stockItems = await provider.read<any[]>('stock_items.json', activeCompany.path) || [];

            // Recent Vouchers
            const sortedVouchers = [...vouchers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
            setRecentVouchers(sortedVouchers);

            // Stock Watch (Top 5 by Value for now, or Low Stock)
            // Let's show items with lowest quantity to simulate "Low Stock" or just high value items.
            // Let's do High Value for positive vibe.
            const sortedStock = [...stockItems].sort((a, b) => {
                const valA = (a.currentBalance || a.openingStock) * (a.currentRate || a.openingRate);
                const valB = (b.currentBalance || b.openingStock) * (b.currentRate || b.openingRate);
                return valB - valA;
            }).slice(0, 5);
            setStockWatch(sortedStock);

            // Map ledger name to group
            const ledgerGroupMap = new Map(ledgers.map(l => [l.name, l.group]));

            // Calculate stats
            let revenue = 0;
            let expenses = 0;

            // Build month-based aggregation
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyData = months.reduce((acc, month) => {
                acc[month] = { name: month, revenue: 0, expenses: 0 };
                return acc;
            }, {} as Record<string, ChartData>);

            vouchers.forEach(v => {
                const date = new Date(v.date);
                const month = months[date.getMonth()];

                v.rows.forEach(r => {
                    const group = ledgerGroupMap.get(r.account);
                    if (group && ACCT_GROUPS.INCOME.includes(group)) {
                        if (r.type === 'Cr') {
                            revenue += r.credit;
                            monthlyData[month].revenue += r.credit;
                        }
                    }
                    if (group && ACCT_GROUPS.EXPENSES.includes(group)) {
                        if (r.type === 'Dr') {
                            expenses += r.debit;
                            monthlyData[month].expenses += r.debit;
                        }
                    }
                });
            });

            // Calculate Closing Stock Value (for Net Profit)
            // Note: This matches ReportService logic
            const closingStockValue = stockItems.reduce((sum, item) => {
                const balance = item.currentBalance !== undefined ? item.currentBalance : item.openingStock;
                const rate = item.currentRate !== undefined ? item.currentRate : item.openingRate;
                return sum + (balance * rate);
            }, 0);

            const openingStockValue = stockItems.reduce((sum, item) => {
                return sum + (item.openingStock * item.openingRate);
            }, 0);

            setStats([
                { label: 'Total Revenue', value: `₹${revenue.toLocaleString()}`, change: '+0%', icon: DollarSign, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                { label: 'Total Expenses', value: `₹${expenses.toLocaleString()}`, change: '-0%', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                { label: 'Net Profit', value: `₹${(revenue + closingStockValue - (expenses + openingStockValue)).toLocaleString()}`, change: '+0%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }, // Corrected Logic: (Inc + CS) - (Exp + OS)
                { label: 'Vouchers', value: vouchers.length.toString(), change: `+${vouchers.length}`, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ]);

            // Filter out months with no data for a cleaner chart, or just show last 6 months
            const currentMonth = new Date().getMonth();
            const last6Months = [];
            for (let i = 5; i >= 0; i--) {
                const mIdx = (currentMonth - i + 12) % 12;
                last6Months.push(monthlyData[months[mIdx]]);
            }

            setChartData(last6Months);
        };
        loadDashboardData();
    }, [provider, activeCompany]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl mx-auto">
            <motion.div variants={item} className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">
                        {activeCompany?.name || 'Dashboard'}
                    </h1>
                    <p className="text-muted-foreground font-medium">Financial overview for {activeCompany?.financialYear || 'current period'}</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                        Live Preview
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            variants={item}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className="bg-card p-6 rounded-2xl shadow-sm border border-border group relative overflow-hidden transition-colors"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${stat.bg} blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-inner`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <span className={`text-xs font-black px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{stat.label}</h3>
                            <p className="text-2xl font-black mt-1 tracking-tight">{stat.value}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Financial Trends Chart */}
                    <div className="bg-card rounded-3xl shadow-sm border border-border p-8 relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Financial Trends</h2>
                                <p className="text-sm text-muted-foreground">Revenue and expenses over time</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Expenses</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-80 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="rgb(6, 182, 212)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="rgb(6, 182, 212)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="rgb(244, 63, 94)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="rgb(244, 63, 94)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <CartesianGrid vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} strokeDasharray="3 3" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="rgb(6, 182, 212)" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                    <Area type="monotone" dataKey="expenses" stroke="rgb(244, 63, 94)" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Transactions Widget */}
                    <div className="bg-card rounded-3xl shadow-sm border border-border p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black tracking-tight">Recent Transactions</h2>
                            <button onClick={() => navigate('/reports/daybook')} className="text-xs font-bold text-primary hover:underline uppercase tracking-wide">View All</button>
                        </div>
                        <div className="space-y-4">
                            {recentVouchers.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
                            ) : (
                                recentVouchers.map(v => (
                                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-foreground">{v.rows[0]?.account || 'Multiple'}</span>
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">{v.type} • #{v.voucherNo}</span>
                                        </div>
                                        <span className="font-mono font-bold text-foreground">
                                            ₹{v.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card rounded-3xl shadow-sm border border-border p-8">
                        <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
                            Quick Actions
                        </h2>
                        <div className="space-y-4">
                            {[
                                { label: 'New Voucher', icon: Wallet, color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/vouchers/new' },
                                { label: 'Daybook', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/reports/daybook' },
                                { label: 'Stock Summary', icon: PieChart, color: 'text-violet-500', bg: 'bg-violet-500/10', path: '/reports/stock-summary' },
                                { label: 'Audit Trail', icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '/security/audit' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(action.path)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-transparent bg-background hover:bg-muted hover:border-border transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.bg} ${action.color}`}>
                                            <action.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-sm">{action.label}</span>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stock Watch Widget */}
                    <div className="bg-card rounded-3xl shadow-sm border border-border p-8">
                        <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
                            Top Stock Items
                        </h2>
                        <div className="space-y-4">
                            {stockWatch.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No stock items found</p>
                            ) : (
                                stockWatch.map((item, i) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-black">
                                                {i + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-foreground">{item.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-bold">{item.currentBalance || item.openingStock} Units</span>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-sm text-foreground">
                                            ₹{((item.currentBalance || item.openingStock) * (item.currentRate || item.openingRate)).toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
