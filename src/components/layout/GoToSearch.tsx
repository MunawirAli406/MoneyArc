import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Command, FileText, Wallet, BookOpen, Settings, LayoutDashboard, ChevronRight, Package, Hash, Tag, Activity } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Ledger } from '../../services/accounting/ReportService';
import type { StockItem } from '../../services/inventory/types';

const STATIC_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Voucher Entry', path: '/vouchers/new', icon: Wallet, category: 'Actions' },
    { label: 'Daybook', path: '/reports/daybook', icon: BookOpen, category: 'Reports' },
    { label: 'Balance Sheet', path: '/reports/balance-sheet', icon: FileText, category: 'Financials' },
    { label: 'Profit & Loss', path: '/reports/profit-loss', icon: FileText, category: 'Financials' },
    { label: 'GSTR-1 Report', path: '/reports/gst/r1', icon: FileText, category: 'Taxation' },
    { label: 'Ratio Analysis', path: '/reports/ratios', icon: Activity, category: 'Analytics' },
    { label: 'Stock Summary', path: '/reports/stock-summary', icon: Package, category: 'Inventory' },
    { label: 'Settings', path: '/settings', icon: Settings, category: 'System' },
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
    }, [provider, activeCompany, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
                e.preventDefault();
                setIsOpen(true);
                setSelectedIndex(0);
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
        }
    }, [isOpen]);

    const filteredItems = [
        ...STATIC_ITEMS.map(i => ({ ...i, type: 'Page' })),
        ...ledgers.map((l: Ledger) => ({
            label: l.name,
            path: `/ledgers/${l.id}`,
            icon: Tag,
            category: 'Ledgers',
            type: 'Ledger'
        })),
        ...stockItems.map((i: StockItem) => ({
            label: i.name,
            path: `/inventory/items/${i.id}`,
            icon: Hash,
            category: 'Inventory',
            type: 'Item'
        }))
    ].filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 15);

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
            <div className="relative w-64 hidden lg:block">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <div
                    onClick={() => setIsOpen(true)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-muted/50 dark:bg-muted/30 border border-border rounded-2xl text-muted-foreground font-black uppercase tracking-widest cursor-pointer hover:bg-muted/70 dark:hover:bg-muted/50 transition-all flex items-center justify-between group"
                >
                    <span>Go To...</span>
                    <span className="opacity-40 group-hover:opacity-100 transition-opacity dark:opacity-60">Ctrl + G</span>
                </div>
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] px-4 overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-background/60 dark:bg-background/40 backdrop-blur-md"
                                onClick={() => setIsOpen(false)}
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-2xl bg-card/90 dark:bg-card/80 border border-border dark:border-white/10 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden glass-panel"
                            >
                                <div className="p-8 border-b border-border/50">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-[#4285F4]/10 flex items-center justify-center">
                                            <Search className="w-6 h-6 text-[#4285F4]" />
                                        </div>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder="Type to search modules, ledgers, or stock..."
                                            value={query}
                                            onChange={(e) => {
                                                setQuery(e.target.value);
                                                setSelectedIndex(0);
                                            }}
                                            onKeyDown={handleKeyDown}
                                            className="flex-1 bg-transparent border-none outline-none text-xl font-black placeholder:text-muted-foreground/30 tracking-tight"
                                        />
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="px-3 py-1.5 rounded-xl bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors"
                                        >
                                            ESC
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-[50vh] overflow-y-auto p-4 custom-scrollbar">
                                    {filteredItems.length > 0 ? (
                                        <div className="space-y-1">
                                            {filteredItems.map((item, index) => {
                                                const isFirstInCategory = index === 0 || filteredItems[index - 1].category !== item.category;

                                                return (
                                                    <div key={item.path + index}>
                                                        {isFirstInCategory && (
                                                            <div className="px-4 py-2 mt-2">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">{item.category}</span>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleSelect(item.path)}
                                                            onMouseEnter={() => setSelectedIndex(index)}
                                                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group ${index === selectedIndex
                                                                ? 'bg-[#4285F4] text-primary-foreground shadow-xl shadow-[#4285F4]/20 scale-[1.02]'
                                                                : 'hover:bg-muted/50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${index === selectedIndex ? 'bg-white/20' : 'bg-muted text-muted-foreground group-hover:bg-[#4285F4]/10 group-hover:text-[#4285F4]'
                                                                    }`}>
                                                                    <item.icon className="w-5 h-5" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-sm font-black tracking-tight">{item.label}</p>
                                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${index === selectedIndex ? 'text-white/60' : 'text-muted-foreground/60'
                                                                        }`}>
                                                                        {item.type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`flex items-center gap-2 transition-transform duration-300 ${index === selectedIndex ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                                                                <span className="text-[10px] font-black uppercase">Open</span>
                                                                <ChevronRight className="w-4 h-4" />
                                                            </div>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-16 text-center space-y-4">
                                            <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto">
                                                <Search className="w-8 h-8 text-muted-foreground/30" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-foreground tracking-tight">No results found</p>
                                                <p className="text-sm text-muted-foreground">We couldn't find anything matching "{query}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-border/50 bg-muted/10 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-background text-[8px]">ENTER</kbd> Select
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-background text-[8px]">↑↓</kbd> Navigate
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 group cursor-help">
                                        <Command className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-primary transition-colors">Quick Command</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
