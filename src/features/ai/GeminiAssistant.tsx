import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Minimize2, Mic, MicOff } from 'lucide-react';
import clsx from 'clsx';
import GeminiLogo from '../../components/ui/GeminiLogo';
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
        { role: 'ai', text: 'Hi! I am MoneyArc AI. Ask me anything about your finances. You can also use the microphone to speak!' }
    ]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (apiKey) localStorage.setItem('moneyarc_gemini_key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'moneyarc_gemini_key' && e.newValue) {
                setApiKey(e.newValue);
            }
        };
        const handleCustomEvent = (e: any) => {
            if (e.detail) setApiKey(e.detail);
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('moneyarc_key_updated', handleCustomEvent);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('moneyarc_key_updated', handleCustomEvent);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Initialize Web Speech API
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setQuery('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSend = async (customQuery?: string) => {
        const finalQuery = customQuery || query;
        if (!finalQuery.trim() || !apiKey) return;

        const userMsg = finalQuery;
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
                companyName: activeCompany.name,
                symbol: activeCompany.symbol || '₹'
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
                    className="fixed bottom-6 right-6 w-96 h-[550px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-muted rounded-xl relative">
                                <GeminiLogo size={20} />
                                {loading && (
                                    <motion.div
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 bg-primary/20 rounded-xl"
                                    />
                                )}
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
                                <div className="mb-4 flex justify-center">
                                    <GeminiLogo size={48} animate={false} />
                                </div>
                                <h4 className="font-bold">Gemini API Key Required</h4>
                                <p className="text-xs text-muted-foreground">To use AI features, please provide your Google Gemini API Key.</p>
                                <input
                                    type="password"
                                    placeholder="Paste API Key here..."
                                    className="w-full px-4 py-2 rounded-xl bg-muted border border-border text-xs focus:ring-2 ring-primary outline-none"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <button
                                    className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-colors"
                                    onClick={() => { if (apiKey) setMessages(prev => [...prev, { role: 'ai', text: "Key saved! How can I help?" }]) }}
                                >
                                    Save Key
                                </button>
                                <p className="text-[10px] text-muted-foreground">
                                    Get a free key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-primary">Google AI Studio</a>.
                                </p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`
                                            max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed
                                            ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lg'
                                                : 'bg-muted text-foreground rounded-tl-none border border-border/50'}
                                        `}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-border/50">
                                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Thinking...</span>
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
                            <div className="flex items-center gap-2 bg-muted/50 rounded-2xl px-3 py-2 border border-border focus-within:ring-2 ring-primary transition-all relative overflow-hidden">
                                {isListening && (
                                    <motion.div
                                        animate={{ x: ['-100%', '100%'] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent"
                                    />
                                )}
                                <button
                                    onClick={toggleListening}
                                    className={clsx(
                                        "p-2 rounded-lg transition-colors",
                                        isListening ? "bg-rose-500 text-white animate-pulse" : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                                <input
                                    type="text"
                                    placeholder={isListening ? "Listening..." : "Ask about your finances..."}
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground font-medium"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={loading || !query.trim()}
                                    className="p-2 bg-primary rounded-lg text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
