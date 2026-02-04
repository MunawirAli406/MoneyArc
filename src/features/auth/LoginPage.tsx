import { useState } from 'react';
import { Mail, ArrowRight, Loader2, Lock, FolderOpen, PieChart } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { provider, initializeStorage } = usePersistence();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || "/dashboard";

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
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full z-10"
            >
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-2xl shadow-primary/20 mb-4 scale-110">
                        <PieChart className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase px-4">Money<span className="text-primary">Arc</span></h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">Professional Accounting Suite</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-1">Welcome Back</h3>
                        <p className="text-slate-400 text-sm">Unlock your financial data with precision.</p>
                    </div>

                    {!provider ? (
                        <div className="space-y-6">
                            <div className="bg-primary/5 border border-primary/20 p-6 rounded-[2rem] text-center">
                                <FolderOpen className="w-10 h-10 text-primary mx-auto mb-4" />
                                <h4 className="text-white font-bold mb-2">Initialize Data Vault</h4>
                                <p className="text-slate-400 text-xs mb-6 px-4">Select the folder on your computer where your accounting data is stored to proceed.</p>
                                <button
                                    onClick={handleSelectDir}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-3"
                                >
                                    Select Local Folder
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
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
                                className="w-full py-5 bg-gradient-to-r from-primary to-cyan-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
                            >
                                {isLoadingLocal ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Authorize Entry
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="pt-2 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                Connected to: <span className="text-primary/70">Local System Vault</span>
                            </div>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-slate-500 text-sm font-medium">
                        Need to establish a new vault? <Link to="/signup" className="text-primary font-black hover:text-cyan-400 transition-colors uppercase tracking-widest ml-1">Create Account</Link>
                    </p>
                    <div className="flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all">
                        {/* Soft Brand Icons if needed */}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

