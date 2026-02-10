import { motion } from 'framer-motion';
import { Shield, Lock, Eye, AlertCircle, History, UserCheck, Key, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuditService } from '../../services/security/AuditService';

export default function SecurityCenter() {
    const navigate = useNavigate();
    const user = AuditService.getCurrentUser();

    const sections = [
        {
            title: 'Audit Trail',
            desc: 'Complete history of all data modifications and system events.',
            icon: History,
            path: '/security/audit',
            color: 'text-google-blue',
            bg: 'bg-google-blue/10'
        },
        {
            title: 'User Sessions',
            desc: 'Monitor active sessions and login history.',
            icon: UserCheck,
            path: '#',
            color: 'text-google-green',
            bg: 'bg-google-green/10',
            disabled: true
        },
        {
            title: 'Access Control',
            desc: 'Manage permissions and security roles.',
            icon: Lock,
            path: '#',
            color: 'text-google-red',
            bg: 'bg-google-red/10',
            disabled: true
        },
        {
            title: 'API Keys',
            desc: 'Manage external integrations and Gemini access.',
            icon: Key,
            path: '/settings',
            color: 'text-google-yellow',
            bg: 'bg-google-yellow/10'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-8 pb-20"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase leading-none">Security Center</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Governance, Risk & Compliance Hub
                    </p>
                </div>
                <div className="glass-panel px-6 py-4 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Operator</p>
                        <p className="text-sm font-black uppercase tracking-tight">{user?.name || 'SYSTEM'}</p>
                    </div>
                </div>
            </div>

            {/* Security Alerts / Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-8 rounded-[3rem] border-google-green/20 bg-google-green/5 relative overflow-hidden">
                    <div className="flex gap-6 items-start relative z-10">
                        <div className="p-4 bg-google-green/20 rounded-2xl text-google-green">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Defense Status: Optimal</h3>
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                Your data vault is currently synchronized and encrypted. No suspicious activities have been detected in the last rolling 24-hour period.
                            </p>
                        </div>
                    </div>
                    <RefreshCcw className="absolute -bottom-4 -right-4 w-24 h-24 text-google-green/5 -rotate-12" />
                </div>

                <div className="glass-card p-8 rounded-[3rem] border-google-yellow/20 bg-google-yellow/5 relative overflow-hidden">
                    <div className="flex gap-6 items-start relative z-10">
                        <div className="p-4 bg-google-yellow/20 rounded-2xl text-google-yellow">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Privacy Recommendation</h3>
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                You are using Local File System storage. Ensure you perform a manual backup periodically to prevent data loss due to hardware failure.
                            </p>
                        </div>
                    </div>
                    <Eye className="absolute -bottom-4 -right-4 w-24 h-24 text-google-yellow/5 rotate-12" />
                </div>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sections.map((section, idx) => (
                    <motion.button
                        key={idx}
                        whileHover={!section.disabled ? { y: -8, scale: 1.02 } : {}}
                        whileTap={!section.disabled ? { scale: 0.98 } : {}}
                        disabled={section.disabled}
                        onClick={() => navigate(section.path)}
                        className={`glass-card p-8 rounded-[2.5rem] flex flex-col items-start text-left gap-6 transition-all border-border/50 ${section.disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-primary/30 group'}`}
                    >
                        <div className={`p-4 rounded-2xl ${section.bg} ${section.color} shadow-lg shadow-black/5 group-hover:rotate-12 transition-transform`}>
                            <section.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-xs mb-2">{section.title}</h4>
                            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                                {section.desc}
                            </p>
                        </div>
                        {section.disabled && (
                            <span className="mt-auto px-3 py-1 bg-muted rounded-full text-[8px] font-black uppercase tracking-widest text-muted-foreground">Coming Soon</span>
                        )}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
