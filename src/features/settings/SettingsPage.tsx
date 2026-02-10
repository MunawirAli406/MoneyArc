import { Moon, Sun, Palette, Bell, Shield, Info, Clock, Sparkles, Eye, EyeOff, ExternalLink, CheckCircle2, Loader2, Play } from 'lucide-react';
import { useTheme } from './useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import Select from '../../components/ui/Select';
import { useState, useEffect } from 'react';
import { GeminiService } from '../../services/ai/GeminiService';

export default function SettingsPage() {
    const { setTheme, theme } = useTheme();
    const [sessionTimeout, setSessionTimeout] = useState('30m');
    const [geminiKey, setGeminiKey] = useState(localStorage.getItem('moneyarc_gemini_key') || '');
    const [showKey, setShowKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    // No default initialization needed anymore to prevent using blocked keys
    useEffect(() => {
        // Just ensuring state is consistent with localStorage on mount
        const savedKey = localStorage.getItem('moneyarc_gemini_key');
        if (savedKey) setGeminiKey(savedKey);
    }, []);

    const handleKeyChange = (val: string) => {
        setGeminiKey(val);
        localStorage.setItem('moneyarc_gemini_key', val);
        setIsSaved(true);
        setTestResult(null);
        setTimeout(() => setIsSaved(false), 2000);

        // Dispatch custom event for same-tab reactivity
        window.dispatchEvent(new CustomEvent('moneyarc_key_updated', { detail: val }));
    };

    const testConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const service = new GeminiService(geminiKey);
            const response = await service.generateInsight("Say 'Connection Successful' in 2 words.", {
                vouchers: [], ledgers: [], companyName: 'System Test', symbol: '₹'
            });

            if (response.toLowerCase().includes('success')) {
                setTestResult({ success: true, message: 'Gemini AI is online and ready!' });
            } else {
                setTestResult({ success: false, message: response });
            }
        } catch (err: any) {
            setTestResult({ success: false, message: err.message || 'Verification failed.' });
        } finally {
            setIsTesting(false);
        }
    };

    const sections = [
        {
            title: 'Appearance',
            description: 'Customize how MoneyArc looks on your screen.',
            icon: Palette,
            items: [
                {
                    label: 'Theme Mode',
                    description: 'Switch between light and dark themes.',
                    content: (
                        <div className="flex p-1 bg-muted rounded-xl gap-1">
                            {[
                                { id: 'light', icon: Sun, label: 'Light' },
                                { id: 'dark', icon: Moon, label: 'Dark' },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setTheme(mode.id as 'light' | 'dark')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === mode.id
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <mode.icon className="w-4 h-4" />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    )
                }
            ]
        },
        {
            title: 'Notifications',
            description: 'Manage your alerts and updates.',
            icon: Bell,
            items: [
                {
                    label: 'Desktop Notifications',
                    description: 'Receive alerts even when the app is in background.',
                    content: (
                        <div className="w-12 h-6 bg-primary/20 rounded-full relative cursor-not-allowed">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-primary rounded-full" />
                        </div>
                    )
                }
            ]
        },
        {
            title: 'Security',
            description: 'Protect your accounting data.',
            icon: Shield,
            items: [
                {
                    label: 'Session Timeout',
                    description: 'Automatically log out after inactivity.',
                    content: (
                        <Select
                            value={sessionTimeout}
                            onChange={setSessionTimeout}
                            options={[
                                { value: '30m', label: '30 Minutes', icon: Clock, description: 'Standard security' },
                                { value: '1h', label: '1 Hour', icon: Clock, description: 'Flexible focus' },
                                { value: 'never', label: 'Never', icon: Shield, description: 'High risk' },
                            ]}
                            className="w-48"
                        />
                    )
                }
            ]
        },
        {
            title: 'AI & Intelligence',
            description: 'Configure your Gemini AI assistant settings.',
            icon: Sparkles,
            items: [
                {
                    label: 'Gemini API Key',
                    description: 'Required for AI insights and advisor feed.',
                    content: (
                        <div className="flex flex-col gap-3 w-full max-w-md">
                            <div className="relative group">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={geminiKey}
                                    onChange={(e) => handleKeyChange(e.target.value)}
                                    placeholder="paste your api key here..."
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12 font-mono"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <AnimatePresence>
                                        {isSaved && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="text-google-green"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 mt-1">
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline opacity-70 hover:opacity-100"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Get free API key from Google AI Studio
                                </a>

                                <button
                                    onClick={testConnection}
                                    disabled={isTesting || !geminiKey}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3 h-3" />
                                            Test Connection
                                        </>
                                    )}
                                </button>
                            </div>

                            <AnimatePresence>
                                {testResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mt-2 p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 ${testResult.success
                                            ? 'bg-google-green/10 border-google-green/20 text-google-green'
                                            : 'bg-google-red/10 border-google-red/20 text-google-red'
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            {testResult.success ? <CheckCircle2 className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                                        </div>
                                        {testResult.message}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                }
            ]
        },
        {
            title: 'About',
            description: 'Application details.',
            icon: Info,
            items: [
                {
                    label: 'Developer',
                    description: 'Created by',
                    content: <span className="font-medium">Munawir Ali V K</span>
                },
                {
                    label: 'Version',
                    description: 'Current build',
                    content: <span className="font-mono text-sm bg-muted px-2 py-1 rounded">0.0.01</span>
                }
            ]
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8 pb-12"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your application preferences and account settings.</p>
            </div>

            <div className="space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-border bg-muted/30 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <section.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{section.title}</h2>
                                <p className="text-sm text-muted-foreground">{section.description}</p>
                            </div>
                        </div>
                        <div className="p-6 divide-y divide-border">
                            {section.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="py-6 first:pt-0 last:pb-0 flex items-center justify-between gap-8">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{item.label}</h3>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
