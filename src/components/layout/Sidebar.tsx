import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Settings, Wallet, TrendingUp, PieChart, Building2, LogOut, Package } from 'lucide-react';
import clsx from 'clsx';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useAuth } from '../../features/auth/AuthContext.provider';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Vouchers', path: '/vouchers/new' },
    { icon: BookOpen, label: 'Ledgers', path: '/ledgers' },
    { icon: BookOpen, label: 'Ledger Vouchers', path: '/reports/ledger' },
    { icon: BookOpen, label: 'Daybook', path: '/reports/daybook' },
    { icon: FileText, label: 'Balance Sheet', path: '/reports/balance-sheet' },
    { icon: TrendingUp, label: 'Profit & Loss', path: '/reports/profit-loss' },
    { icon: FileText, label: 'GST Reports', path: '/reports/gst' },
    { icon: Wallet, label: 'Cash Flow', path: '/reports/cash-flow' },
    { icon: TrendingUp, label: 'Fund Flow', path: '/reports/fund-flow' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: Package, label: 'Stock Items', path: '/inventory/items' },
    { icon: Package, label: 'Stock Groups', path: '/inventory/groups' },
    { icon: Package, label: 'Units', path: '/inventory/units' },
    { icon: TrendingUp, label: 'Stock Summary', path: '/inventory/stock-summary' },
];

export default function Sidebar() {
    const location = useLocation();
    const { activeCompany } = usePersistence();
    const { user, logout } = useAuth();

    return (
        <div className="w-64 bg-card border-r border-border flex flex-col transition-colors duration-300">
            <div className="h-20 flex flex-col justify-center px-6 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 text-primary mb-1">
                    <div className="w-8 h-8 rounded-lg cyan-gradient flex items-center justify-center text-white cyan-glow">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">MoneyArc</span>
                </div>
                {activeCompany ? (
                    <div className="flex items-center gap-2 text-[10px] text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full w-fit max-w-full uppercase tracking-wider">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{activeCompany.name}</span>
                    </div>
                ) : (
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">No Selection</div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                        >
                            <item.icon className={clsx('w-5 h-5 transition-transform group-hover:scale-110', isActive ? 'text-primary-foreground' : 'text-primary/70')} />
                            <span className="font-semibold text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border bg-muted/10">
                <div className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-border hover:bg-card transition-all group">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl cyan-gradient flex items-center justify-center text-white font-bold shadow-md shadow-primary/10 group-hover:scale-105 transition-transform flex-shrink-0">
                            {user?.name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate font-mono">{user?.email || 'user@example.com'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        title="Logout"
                        className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
