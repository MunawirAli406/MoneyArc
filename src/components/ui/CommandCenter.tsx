import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, FileText, User, Box, ArrowRight, LayoutDashboard, Settings, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { Ledger } from '../../services/accounting/ReportService';
import type { StockItem } from '../../services/inventory/types';

interface SearchResult {
    id: string;
    title: string;
    description: string;
    icon: any;
    category: 'Pages' | 'Ledgers' | 'Inventory' | 'Actions';
    path: string;
}

export default function CommandCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const { provider, activeCompany } = usePersistence();
    const inputRef = useRef<HTMLInputElement>(null);

    const STATIC_PAGES: SearchResult[] = [
        { id: 'dash', title: 'Dashboard', description: 'Overview of your business', icon: LayoutDashboard, category: 'Pages', path: '/dashboard' },
        { id: 'vouch', title: 'New Voucher', description: 'Record a new transaction', icon: FileText, category: 'Actions', path: '/vouchers/new' },
        { id: 'bal', title: 'Balance Sheet', description: 'Financial position', icon: Box, category: 'Pages', path: '/reports/balance-sheet' },
        { id: 'settings', title: 'Settings', description: 'System preferences', icon: Settings, category: 'Pages', path: '/settings' },
        { id: 'audit', title: 'Audit Trail', description: 'Security logs', icon: History, category: 'Pages', path: '/security/audit' },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchAndFilter = async () => {
            if (!isOpen) return;

            let allResults = [...STATIC_PAGES];

            if (activeCompany && provider) {
                const [ledgers, stock] = await Promise.all([
                    provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                    provider.read<StockItem[]>('stock_items.json', activeCompany.path)
                ]);

                if (ledgers) {
                    allResults = [...allResults, ...ledgers.slice(0, 10).map(l => ({
                        id: `ledger-${l.id}`,
                        title: l.name,
                        description: `Type: ${l.group}`,
                        icon: User,
                        category: 'Ledgers' as const,
                        path: `/ledgers/${l.id}`
                    }))];
                }

                if (stock) {
                    allResults = [...allResults, ...stock.slice(0, 10).map(s => ({
                        id: `stock-${s.id}`,
                        title: s.name,
                        description: `Balance: ${s.currentBalance || s.openingStock} ${s.unitId}`,
                        icon: Box,
                        category: 'Inventory' as const,
                        path: `/inventory/items/${s.id}`
                    }))];
                }
            }

            const filtered = allResults.filter(item =>
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase()) ||
                item.category.toLowerCase().includes(search.toLowerCase())
            );

            setResults(filtered.slice(0, 8));
            setSelectedIndex(0);
        };

        fetchAndFilter();
    }, [search, isOpen, activeCompany, provider]);

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex].path);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden glass"
                        onKeyDown={onKeyDown}
                    >
                        <div className="flex items-center p-6 border-b border-border">
                            <Search className="w-5 h-5 text-muted-foreground mr-4" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search ledgers, items, reports... (Ctrl+K)"
                                className="flex-1 bg-transparent border-none outline-none text-lg font-bold placeholder:text-muted-foreground/50"
                            />
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border">
                                <Command className="w-3 h-3" />
                                <span>K</span>
                            </div>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {results.length > 0 ? (
                                <div className="space-y-4">
                                    {(['Pages', 'Actions', 'Ledgers', 'Inventory'] as const).map(category => {
                                        const categoryResults = results.filter(r => r.category === category);
                                        if (categoryResults.length === 0) return null;

                                        return (
                                            <div key={category} className="space-y-2">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-4">
                                                    {category}
                                                </h3>
                                                {categoryResults.map((result) => {
                                                    const globalIndex = results.indexOf(result);
                                                    const isSelected = globalIndex === selectedIndex;

                                                    return (
                                                        <div
                                                            key={result.id}
                                                            onClick={() => handleSelect(result.path)}
                                                            className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${isSelected
                                                                ? 'bg-primary/10 border-primary/20 scale-[1.02]'
                                                                : 'hover:bg-muted/50 border-transparent'
                                                                } border`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}`}>
                                                                    <result.icon className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-foreground">{result.title}</p>
                                                                    <p className="text-xs text-muted-foreground font-medium">{result.description}</p>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <motion.div layoutId="arrow" initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                                                    <ArrowRight className="w-4 h-4 text-primary" />
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-muted-foreground font-bold italic">No results found for "{search}"</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-lg">
                                        <ArrowRight className="w-3 h-3 rotate-90" />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Navigate</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-1.5 py-1 bg-card border border-border rounded-lg text-[10px] font-black">ENT</div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Select</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">MoneyArc OmniSearch v1.0</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
