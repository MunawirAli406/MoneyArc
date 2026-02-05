import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Key, Loader2, Minimize2 } from 'lucide-react';
import { GeminiService } from '../../services/ai/GeminiService';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { Voucher } from '../../services/accounting/VoucherService';
import type { Ledger } from '../../services/accounting/ReportService';

interface GeminiAssistantProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GeminiAssistant({ isOpen, onClose }: GeminiAssistantProps) {
    const { provider, activeCompany } = usePersistence();
    const [apiKey, setApiKey] = useState(localStorage.getItem('moneyarc_gemini_key') || '');
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: 'Hi! I am moneyArc AI. Ask me anything about your finances.' }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (apiKey) localStorage.setItem('moneyarc_gemini_key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!query.trim() || !apiKey) return;

        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery('');
        setLoading(true);

        try {
            if (!provider || !activeCompany) throw new Error("Data source not ready");

            const [vouchers, ledgers] = await Promise.all([
                provider.read<Voucher[]>('vouchers.json', activeCompany.path),
                provider.read<Ledger[]>('ledgers.json', activeCompany.path)
            ]);

            const service = new GeminiService(apiKey);
            const response = await service.generateInsight(userMsg, {
                vouchers: vouchers || [],
                ledgers: ledgers || [],
                companyName: activeCompany.name
            });

            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't process that. Check your API Key or connection." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-wider">MoneyArc AI</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                            <Minimize2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                        {!apiKey ? (
                            <div className="text-center p-6 space-y-4">
                                <Key className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
                                <h4 className="font-bold">Gemini API Key Required</h4>
                                <p className="text-xs text-muted-foreground">To use AI features, please provide your Google Gemini API Key.</p>
                                <input
                                    type="password"
                                    placeholder="Paste API Key here..."
                                    className="w-full px-4 py-2 rounded-xl bg-muted border border-border text-xs focus:ring-2 ring-indigo-500 outline-none"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <button
                                    className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors"
                                    onClick={() => { if (apiKey) setMessages(prev => [...prev, { role: 'ai', text: "Key saved! How can I help?" }]) }}
                                >
                                    Save Key
                                </button>
                                <p className="text-[10px] text-muted-foreground">
                                    Get a free key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-indigo-500">Google AI Studio</a>.
                                </p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`
                                            max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed
                                            ${msg.role === 'user'
                                                ? 'bg-indigo-500 text-white rounded-tr-none'
                                                : 'bg-muted text-foreground rounded-tl-none'}
                                        `}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                            <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                                            <span className="text-xs text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    {apiKey && (
                        <div className="p-3 border-t border-border bg-card">
                            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2 border border-border focus-within:ring-2 ring-indigo-500 transition-all">
                                <input
                                    type="text"
                                    placeholder="Ask about your finances..."
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !query.trim()}
                                    className="p-2 bg-indigo-500 rounded-lg text-white disabled:opacity-50 hover:bg-indigo-600 transition-colors"
                                >
                                    <Send className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
