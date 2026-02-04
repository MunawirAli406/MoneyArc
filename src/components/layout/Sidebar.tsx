import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Settings, Wallet, TrendingUp, PieChart } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Vouchers', path: '/vouchers' },
    { icon: BookOpen, label: 'Ledgers', path: '/ledgers' },
    { icon: BookOpen, label: 'Daybook', path: '/reports/daybook' },
    { icon: FileText, label: 'Balance Sheet', path: '/reports/balance-sheet' },
    { icon: TrendingUp, label: 'Profit & Loss', path: '/reports/profit-loss' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
                <div className="flex items-center gap-2 text-primary-600">
                    <PieChart className="w-8 h-8" />
                    <span className="text-xl font-bold text-gray-900">MoneyArc</span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                        >
                            <item.icon className={clsx('w-5 h-5', isActive ? 'text-primary-600' : 'text-gray-400')} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        U
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">User</p>
                        <p className="text-xs text-gray-500">user@example.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
