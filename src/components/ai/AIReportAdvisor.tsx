import { useState, useEffect } from 'react';
import { Sparkles, Loader2, MessageSquare, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeminiService } from '../../services/ai/GeminiService';
import { usePersistence } from '../../services/persistence/PersistenceContext';

interface AIReportAdvisorProps {
    reportName: string;
    data: any;
    context?: string;
}

export default function AIReportAdvisor({ reportName, data, context }: AIReportAdvisorProps) {
    const { activeCompany } = usePersistence();
    const [apiKey, setApiKey] = useState(localStorage.getItem('moneyarc_gemini_key') || '');
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleKeyUpdate = (e: any) => {
            const newKey = e.detail || localStorage.getItem('moneyarc_gemini_key');
            if (newKey) setApiKey(newKey);
        };
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'moneyarc_gemini_key' && e.newValue) setApiKey(e.newValue);
        };
        window.addEventListener('moneyarc_key_updated', handleKeyUpdate);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('moneyarc_key_updated', handleKeyUpdate);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const generateInsight = async () => {
        const currentApiKey = apiKey || localStorage.getItem('moneyarc_gemini_key') || '';
        if (!currentApiKey) return;

        setLoading(true);
        setIsExpanded(true);
        try {
            const service = new GeminiService(currentApiKey);
            const prompt = `
                Act as a high-end CFO. Analyze this "${reportName}" report for ${activeCompany?.name}.
                Data: ${JSON.stringify(data, null, 2)}
                ${context ? `Additional Context: ${context}` : ''}
                
                Provide:
                1. A 3-bullet "Executive Summary" (concise).
                2. One "Critical Warning" or "Growth Opportunity".
                3. One actionable advice for the next 30 days.
                
                Use a professional, sharp, and encouraging tone. Use ${activeCompany?.symbol || '₹'} for currency.
                Format with markdown (bolding, etc.).
            `;
            const result = await service.generateInsight(prompt, {
                vouchers: [],
                ledgers: [],
                companyName: activeCompany?.name || '',
                symbol: activeCompany?.symbol || '₹'
            });
            setInsight(result);
        } catch (error) {
            console.error(error);
            setInsight("I encountered an error analyzing this report. Please check your connectivity.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-8">
            <motion.div
                layout
                className="glass-panel overflow-hidden border-primary/20 shadow-2xl relative"
                initial={false}
            >
                <div className="p-4 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                            <Sparkles className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-tighter">AI Financial Advisor</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Contextual Insight for {reportName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!insight && !loading ? (
                            <button
                                onClick={generateInsight}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                            >
                                <MessageSquare className="w-3 h-3" />
                                Run Smart Analysis
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={generateInsight}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground"
                                    title="Regenerate"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground"
                                >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/5"
                        >
                            <div className="p-6 relative">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                                        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse opacity-50">CFO is analyzing your data...</p>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                                        <div className="text-[11px] leading-relaxed font-medium whitespace-pre-wrap">
                                            {insight}
                                        </div>
                                    </div>
                                )}

                                <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
