import { useState } from 'react';
import { Mail, User, Lock, ArrowRight, Loader2, PieChart, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.provider';
import { usePersistence } from '../../services/persistence/PersistenceContext';

export default function SignUpPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    const [error, setError] = useState('');

    const { signup } = useAuth();
    const { provider, initializeStorage } = usePersistence();
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider) {
            setError('Please select a data source folder first.');
            return;
        }
        setError('');
        setIsLoadingLocal(true);
        try {
            await signup(formData.email, formData.name, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError((err as Error).message || 'Failed to create account.');
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
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full z-10"
            >
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-xl shadow-primary/20 mb-3">
                        <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Money<span className="text-primary-400">Arc</span></h2>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40" />

                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Establish Identity</h1>
                        <p className="text-slate-400 text-sm">Join the elite accounting ecosystem.</p>
                    </div>

                    {!provider ? (
                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] text-center">
                            <FolderOpen className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                            <h4 className="text-white font-bold text-lg mb-2">Target Directory Missing</h4>
                            <p className="text-slate-400 text-xs mb-8 leading-relaxed">Account data must be anchored to a physical directory. Please initialize your storage vault.</p>
                            <button
                                onClick={handleSelectDir}
                                className="w-full py-4.5 bg-primary text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                                Initialize Vault
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSignUp} className="space-y-5">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 text-[11px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl italic uppercase tracking-wider"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Full Legal Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-primary transition-all shadow-sm" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[1.25rem] text-white text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Vault Identity (Email)</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-primary transition-all shadow-sm" />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[1.25rem] text-white text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Secure Key (Password)</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-primary transition-all shadow-sm" />
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[1.25rem] text-white text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoadingLocal}
                                className="w-full py-5 bg-gradient-to-r from-primary to-cyan-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
                            >
                                {isLoadingLocal ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Register & Open Vault
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center mt-8 text-sm text-slate-500 font-medium">
                    Already registered? <Link to="/login" className="text-primary font-black uppercase tracking-widest text-xs ml-2 hover:text-cyan-400 transition-colors">Log in</Link>
                </p>

                <div className="mt-8 pt-8 border-t border-white/5 flex justify-center items-center gap-3">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Powered by MoneyArc File-Sync Engine</span>
                </div>
            </motion.div>
        </div>
    );
}

