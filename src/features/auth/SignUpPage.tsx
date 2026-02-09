import { useState } from 'react';
import { Mail, User, Lock, ArrowRight, Loader2, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.provider';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import Logo from '../../components/ui/Logo';

export default function SignUpPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    const [error, setError] = useState('');

    const { signup, loginWithSocial } = useAuth();
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Google Brand Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex z-50">
                <div className="h-full flex-1 bg-google-blue" />
                <div className="h-full flex-1 bg-google-red" />
                <div className="h-full flex-1 bg-google-yellow" />
                <div className="h-full flex-1 bg-google-green" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full z-10"
            >
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <Logo size={48} showText={true} className="flex-col !gap-3" />
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative">

                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Establish Identity</h1>
                        <p className="text-slate-500 text-sm">Join the elite accounting ecosystem.</p>
                    </div>

                    {!provider ? (
                        <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] text-center">
                            <FolderOpen className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                            <h4 className="text-slate-900 font-bold text-lg mb-2">
                                {'showDirectoryPicker' in window ? 'Target Directory Missing' : 'Initialize Mobile Storage'}
                            </h4>
                            <p className="text-slate-500 text-xs mb-8 leading-relaxed">
                                {'showDirectoryPicker' in window
                                    ? 'Account data must be anchored to a physical directory. Please initialize your storage vault.'
                                    : 'Mobile usage detected. Data will be stored securely in this browser instance and cannot be accessed externally.'}
                            </p>
                            <button
                                onClick={handleSelectDir}
                                className="w-full py-4.5 bg-primary text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                                {'showDirectoryPicker' in window ? 'Initialize Vault' : 'Initialize Local Storage'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
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
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Legal Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-all shadow-sm" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-slate-900 text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-300"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Vault Identity (Email)</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-all shadow-sm" />
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-slate-900 text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-300"
                                                placeholder="name@company.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Key (Password)</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-all shadow-sm" />
                                            <input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-slate-900 text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-300"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoadingLocal}
                                    className="w-full py-5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
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

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-100"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Or sign up with</span>
                                <div className="flex-grow border-t border-slate-100"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await loginWithSocial('google.user@example.com', 'Google User', 'Google');
                                            navigate('/dashboard');
                                        } catch (err) {
                                            console.error("Google sign up failed", err);
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm"
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
                                    onClick={async () => {
                                        try {
                                            await loginWithSocial('microsoft.user@example.com', 'Microsoft User', 'Microsoft');
                                            navigate('/dashboard');
                                        } catch (err) {
                                            console.error("Microsoft sign up failed", err);
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 23 23">
                                        <path fill="#00a1f1" d="M12 0h11v11H12z" />
                                        <path fill="#f25022" d="M0 0h11v11H0z" />
                                        <path fill="#7fb900" d="M0 12h11v11H0z" />
                                        <path fill="#ffb900" d="M12 12h11v11H12z" />
                                    </svg>
                                    Microsoft
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center mt-8 text-sm text-slate-400 font-medium">
                    Already registered? <Link to="/login" className="text-google-blue font-black uppercase tracking-widest text-xs ml-2 hover:text-google-blue/70 transition-colors">Log in</Link>
                </p>

                <div className="mt-8 pt-8 border-t border-white/5 flex justify-center items-center gap-3">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Powered by MoneyArc File-Sync Engine</span>
                </div>
            </motion.div>
        </div>
    );
}

