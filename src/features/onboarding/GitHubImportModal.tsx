import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, X, ArrowRight, Loader2, Globe } from 'lucide-react';

interface GitHubImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (config: { owner: string; repo: string; branch: string; path: string }) => Promise<void>;
}

export default function GitHubImportModal({ isOpen, onClose, onImport }: GitHubImportModalProps) {
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');
    const [branch, setBranch] = useState('main');
    const [path, setPath] = useState('data');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!owner || !repo) {
            setError('Owner and Repository are required');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await onImport({ owner, repo, branch, path });
            onClose();
        } catch (err) {
            setError('Failed to connect to repository. Check your details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden glass p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-foreground/10 rounded-2xl">
                                    <Github className="w-6 h-6 text-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight uppercase">Import from GitHub</h2>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Connect your repo</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Owner</label>
                                    <input
                                        type="text"
                                        value={owner}
                                        onChange={(e) => setOwner(e.target.value)}
                                        placeholder="e.g. facebook"
                                        className="input-premium w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Repository</label>
                                    <input
                                        type="text"
                                        value={repo}
                                        onChange={(e) => setRepo(e.target.value)}
                                        placeholder="e.g. react"
                                        className="input-premium w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Branch</label>
                                    <input
                                        type="text"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        placeholder="main"
                                        className="input-premium w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Path</label>
                                    <input
                                        type="text"
                                        value={path}
                                        onChange={(e) => setPath(e.target.value)}
                                        placeholder="e.g. accounts"
                                        className="input-premium w-full"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-premium w-full bg-foreground text-background flex items-center justify-center gap-3 py-4"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Globe className="w-5 h-5" />
                                            <span>Start Import Process</span>
                                        </>
                                    )}
                                    <ArrowRight className="w-4 h-4 ml-auto" />
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t border-border flex justify-center text-center">
                            <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed">
                                MoneyArc will fetch your JSON data files from the selected repository.
                                <br />Note: This connection is read-only.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
