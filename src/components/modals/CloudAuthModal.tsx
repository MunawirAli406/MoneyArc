import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Loader2, ChevronRight, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { GoogleAuth } from '../../services/auth/GoogleAuth';
import { MicrosoftAuth } from '../../services/auth/MicrosoftAuth';

interface CloudAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'google-drive' | 'onedrive';
    onConnect: (identity: string, accessKey: string) => Promise<void>;
}

export default function CloudAuthModal({ isOpen, onClose, type, onConnect }: CloudAuthModalProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const isGoogle = type === 'google-drive';
    const brandBg = isGoogle ? 'bg-google-blue' : 'bg-google-red';

    // Clear error when opening
    useEffect(() => {
        if (isOpen) setError('');
    }, [isOpen]);

    const handleConnect = async () => {
        setError('');
        setIsConnecting(true);

        // Add a timeout to prevent infinite loading if popup is blocked or hangs
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Authentication timed out. Please check if popups are blocked.')), 60000)
        );

        try {
            let token = '';
            let identity = '';

            const authPromise = isGoogle ? GoogleAuth.login() : MicrosoftAuth.login();
            const response = await Promise.race([authPromise, timeoutPromise]) as any;

            if (isGoogle) {
                token = response.access_token;
                identity = 'Google Account';
            } else {
                token = response.accessToken;
                identity = response.account.username;
            }

            await onConnect(identity, token);
            onClose();
        } catch (err: any) {
            console.error('Cloud connection error:', err);
            let msg = err.message || err.error || 'Failed to authenticate.';
            if (msg.includes('not configured')) {
                msg = 'ACTION REQUIRED: The developer has not configured the Client IDs for ' + (isGoogle ? 'Google' : 'Microsoft') + ' yet. Please check src/config/auth.ts';
            }
            setError(msg);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 no-print">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-card w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden"
                    >
                        <div className={clsx("absolute top-0 left-0 right-0 h-1.5", brandBg)} />

                        <div className="p-8 text-center">
                            <div className="flex items-center justify-between mb-8 text-left">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-xl bg-opacity-10", brandBg)}>
                                        {isGoogle ? (
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path d="M12.5 1.5L2 20h21L12.5 1.5z" fill="#FFC107" />
                                                <path d="M7 20l5.5-9.5L18 20H7z" fill="#1976D2" />
                                                <path d="M12.5 10.5L18 20h4L14.5 4.5 12.5 10.5z" fill="#4CAF50" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" viewBox="0 0 32 32">
                                                <path d="M22.5 11c-3.1 0-5.7 2.1-6.5 5-.7-.4-1.5-.6-2.3-.6-1.5 0-2.8.9-3.4 2.1-.6-.3-1.3-.5-2.1-.5-1.9 0-3.5 1.4-3.7 3.2C2.8 21 1.5 22.8 1.5 25c0 3.3 2.7 6 6 6h15c4.1 0 7.5-3.4 7.5-7.5S26.6 16 22.5 16s-4.5 0-4.5 0c0-2.8 2.2-5 5-5" fill="#00A4EF" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                                            {isGoogle ? 'Google Drive' : 'OneDrive'}
                                        </h2>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Official Sync</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {error ? (
                                    <motion.div
                                        key="error"
                                        initial={{ height: 0, opacity: 0, y: -10 }}
                                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                                        exit={{ height: 0, opacity: 0, y: -10 }}
                                        className="mb-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed flex items-start gap-3 text-left"
                                    >
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="content"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mb-10 space-y-4"
                                    >
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Cloud Connection</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {isGoogle
                                                ? "Sign in to grant MoneyArc permission to store your encrypted accounting vaults in a dedicated 'MoneyArc_Data' folder in your Google Drive."
                                                : "Sign in to grant MoneyArc permission to store your encrypted accounting vaults in your personal OneDrive App folder."}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className={clsx(
                                    "w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] disabled:opacity-50 text-white mb-8",
                                    brandBg
                                )}
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Opening Secure Popup...
                                    </>
                                ) : (
                                    <>
                                        {isGoogle ? (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="currentColor" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" viewBox="0 0 23 23">
                                                <path fill="white" d="M12 0h11v11H12z" />
                                                <path fill="white" d="M0 0h11v11H0z" />
                                                <path fill="white" d="M0 12h11v11H0z" />
                                                <path fill="white" d="M12 12h11v11H12z" />
                                            </svg>
                                        )}
                                        Sign in with {isGoogle ? 'Google' : 'Microsoft'}
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="bg-muted/30 p-5 rounded-3xl border border-border/50 flex items-start gap-4 text-left">
                                <ShieldCheck className="w-5 h-5 text-google-green mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-foreground font-black uppercase tracking-widest mb-1">Privacy Guarantee</p>
                                    <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">
                                        MoneyArc never sees your password. The login happens through {isGoogle ? 'Google' : 'Microsoft'}'s secure servers. We only receive a temporary token to access your data folder.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
