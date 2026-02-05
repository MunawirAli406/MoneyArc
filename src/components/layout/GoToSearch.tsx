import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, FileText, Wallet, BookOpen, Settings, LayoutDashboard, ChevronRight, Package } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { Ledger } from '../../services/accounting/ReportService';
import type { StockItem } from '../../services/inventory/types';

const STATIC_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Voucher Entry', path: '/vouchers/new', icon: Wallet },
    { label: 'Chart of Accounts', path: '/ledgers', icon: BookOpen },
    { label: 'Daybook', path: '/reports/daybook', icon: BookOpen },
    { label: 'Balance Sheet', path: '/reports/balance-sheet', icon: FileText },
    { label: 'Profit & Loss', path: '/reports/profit-loss', icon: FileText },
    { label: 'GSTR-1 Report', path: '/reports/gst/r1', icon: FileText },
    { label: 'GSTR-3B Summary', path: '/reports/gst/r3b', icon: FileText },
    { label: 'Ratio Analysis', path: '/reports/ratios', icon: FileText },
    { label: 'Audit Trail', path: '/security/audit', icon: Search },
    { label: 'GST Overview', path: '/reports/gst', icon: FileText },
    { label: 'Cash Flow', path: '/reports/cash-flow', icon: Wallet },
    { label: 'Fund Flow', path: '/reports/fund-flow', icon: FileText },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Stock Items', path: '/inventory/items', icon: Package },
    { label: 'Stock Groups', path: '/inventory/groups', icon: Package },
    { label: 'Units of Measure', path: '/inventory/units', icon: Package },
];

export default function GoToSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadDocs = async () => {
            if (provider && activeCompany) {
                const [ledgerData, itemData] = await Promise.all([
                    provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                    provider.read<StockItem[]>('stock_items.json', activeCompany.path)
                ]);
                setLedgers(ledgerData || []);
                setStockItems(itemData || []);
            }
        };
        loadDocs();
    }, [provider, activeCompany]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const filteredItems = [
        ...STATIC_ITEMS.map(i => ({ ...i, type: 'Page' })),
        ...ledgers.map((l: Ledger) => ({
            label: `Ledger: ${l.name}`,
            path: `/ledgers/${l.id}`,
            icon: BookOpen,
            type: 'Ledger'
        })),
        ...stockItems.map((i: StockItem) => ({
            label: `Item: ${i.name}`,
            path: `/inventory/items/${i.id}`,
            icon: Package,
            type: 'Inventory'
        }))
    ].filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev: number) => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev: number) => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter') {
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex].path);
            }
        }
    };

    return (
        <>
            <div className="relative w-64 hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Go To... (Ctrl+G)"
                    onFocus={() => setIsOpen(true)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
                    readOnly
                />
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

                    <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                        <div className="p-6 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-4">
                                <Command className="w-5 h-5 text-primary" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Where would you like to go?"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 bg-transparent border-none outline-none text-lg font-bold placeholder:text-muted-foreground"
                                />
                                <div className="px-2 py-1 rounded-lg bg-background border border-border text-[10px] font-black uppercase text-muted-foreground">
                                    ESC to close
                                </div>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, index) => (
                                    <button
                                        key={item.path + index}
                                        onClick={() => handleSelect(item.path)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${index === selectedIndex ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${index === selectedIndex ? 'bg-white/20' : 'bg-primary/10 text-primary'
                                                }`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold">{item.label}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${index === selectedIndex ? 'text-white/60' : 'text-muted-foreground'
                                                    }`}>
                                                    {item.type}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 ${index === selectedIndex ? 'opacity-100' : 'opacity-20'}`} />
                                    </button>
                                ))
                            ) : (
                                <div className="p-12 text-center text-muted-foreground">
                                    <p className="font-bold">No results for "{query}"</p>
                                    <p className="text-sm">Try searching for a report or ledger name.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border bg-muted/10 flex items-center gap-6 justify-center">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <span className="px-1.5 py-0.5 rounded border border-border bg-background">ENTER</span> Select
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <span className="px-1.5 py-0.5 rounded border border-border bg-background">↑↓</span> Navigate
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
