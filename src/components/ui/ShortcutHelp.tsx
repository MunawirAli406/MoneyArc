import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, ArrowRight } from 'lucide-react';

interface Shortcut {
    key: string;
    description: string;
    category: 'Navigation' | 'Actions' | 'Reporting';
}

const SHORTCUTS: Shortcut[] = [
    { key: 'Alt + H', description: 'Go to Dashboard', category: 'Navigation' },
    { key: 'Alt + V', description: 'New Voucher', category: 'Actions' },
    { key: 'Alt + D', description: 'Open Daybook', category: 'Reporting' },
    { key: 'Alt + S', description: 'Stock Summary', category: 'Reporting' },
    { key: 'Alt + B', description: 'Balance Sheet', category: 'Reporting' },
    { key: 'Ctrl + K', description: 'Universal Search', category: 'Navigation' },
    { key: '?', description: 'Show Shortcuts', category: 'Navigation' },
];

export default function ShortcutHelp() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-background/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                        className="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden glass p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Keyboard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight uppercase">Shortcut Command</h2>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Master MoneyArc Workflow</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-muted rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {(['Navigation', 'Actions', 'Reporting'] as const).map(category => (
                                <div key={category} className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 border-b border-primary/10 pb-2">
                                        {category}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {SHORTCUTS.filter(s => s.category === category).map((s, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/50 group hover:bg-muted/40 transition-all">
                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{s.description}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-1 bg-card border border-border rounded-lg text-[10px] font-black shadow-sm uppercase tracking-tighter">
                                                        {s.key}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-border flex justify-center">
                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                Efficiency is Built-in <ArrowRight className="w-3 h-3" /> MoneyArc v1.0
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
