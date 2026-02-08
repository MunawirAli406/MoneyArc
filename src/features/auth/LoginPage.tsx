import { useState } from 'react';
import { Mail, ArrowRight, Loader2, Lock, FolderOpen } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.provider';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../components/ui/Logo';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { provider, initializeStorage } = usePersistence();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider) {
            setError('Please select a data source folder first.');
            return;
        }
        setError('');
        setIsLoadingLocal(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError((err as Error).message || 'Invalid credentials.');
        } finally {
            setIsLoadingLocal(false);
        }
    };

    const handleSelectDir = async () => {
        try {
            await initializeStorage('local');
            setError('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-900/20 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full z-10"
            >
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10">
                    <Logo size={64} showText={true} className="flex-col !gap-4" />
                </div>

                <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    <div className="mb-8 text-center">
                        <h3 className="text-xl font-bold text-white mb-1">Welcome Back</h3>
                        <p className="text-slate-400 text-sm">Unlock your financial data with precision.</p>
                    </div>

                    {!provider ? (
                        <div className="space-y-6">
                            <div className="bg-primary/5 border border-primary/20 p-6 rounded-[2rem] text-center">
                                <FolderOpen className="w-10 h-10 text-primary mx-auto mb-4" />
                                <h4 className="text-white font-bold mb-2">Initialize Data Vault</h4>
                                <div className="space-y-3">
                                    {'showDirectoryPicker' in window && (
                                        <>
                                            <p className="text-slate-400 text-xs mb-2 px-4">Select the folder on your computer where your accounting data is stored.</p>
                                            <button
                                                onClick={handleSelectDir}
                                                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-3"
                                            >
                                                Select Local Folder
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}

                                    {!('showDirectoryPicker' in window) && (
                                        <p className="text-rose-400 text-xs px-4 font-bold bg-rose-500/10 py-2 rounded-lg border border-rose-500/20 mb-2">
                                            Desktop capabilities not detected. Using Mobile Mode.
                                        </p>
                                    )}

                                    <button
                                        onClick={() => initializeStorage('browser')}
                                        className="w-full py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-3 border border-white/5"
                                    >
                                        Use Browser Storage (Mobile)
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <form onSubmit={handleLogin} className="space-y-5">
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold italic"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity (Email)</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                                                placeholder="admin@company.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key (Password)</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoadingLocal}
                                    className="w-full py-4 bg-gradient-to-r from-primary to-teal-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoadingLocal ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            Authorize Entry
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => alert("Google Login integration requires cloud configuration.")}
                                    className="flex items-center justify-center gap-2 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </button>
                                <button
                                    type="button"
                                    onClick={() => alert("Microsoft Login integration requires cloud configuration.")}
                                    className="flex items-center justify-center gap-2 py-3 bg-[#2f2f2f] text-white rounded-xl font-bold text-xs hover:bg-[#3f3f3f] transition-colors border border-white/10"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 23 23">
                                        <path fill="#f3f3f3" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                                    </svg>
                                    Microsoft
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-slate-500 text-sm font-medium">
                        Need to establish a new vault? <Link to="/signup" className="text-primary font-black hover:text-teal-400 transition-colors uppercase tracking-widest ml-1">Create Account</Link>
                    </p>
                </div>
            </motion.div>
        </div >
    );
}

