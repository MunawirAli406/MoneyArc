import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Activity, Search } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { AuditService, type AuditLog } from '../../services/security/AuditService';

export default function AuditLogViewer() {
    const { provider, activeCompany } = usePersistence();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [processingClaim, setProcessingClaim] = useState(false);

    useEffect(() => {
        const loadLogs = async () => {
            if (provider && activeCompany) {
                const data = await AuditService.getLogs(provider, activeCompany.path);
                setLogs(data);
                setLoading(false);
            }
        };
        loadLogs();
    }, [provider, activeCompany]);

    const refreshLogs = async () => {
        if (provider && activeCompany) {
            setLoading(true);
            const data = await AuditService.getLogs(provider, activeCompany.path);
            setLogs(data);
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(l =>
        l.details.toLowerCase().includes(filter.toLowerCase()) ||
        l.entityType.toLowerCase().includes(filter.toLowerCase()) ||
        l.action.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest animate-pulse">Retrieving Audit Trail...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-8 pb-20"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Audit Trail</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">System Compliance & Security Logs</p>
                        <span className="text-muted-foreground/30">•</span>
                        <p className="text-primary font-black uppercase tracking-widest text-[10px]">
                            Logged in as: {AuditService.getCurrentUser()?.name || 'Unknown'}
                        </p>
                    </div>
                </div>
                <div className="relative group min-w-[300px] flex items-center gap-2">
                    <button
                        onClick={async () => {
                            if (!provider || !activeCompany) return;
                            const currentUser = AuditService.getCurrentUser();
                            if (!currentUser) return;

                            if (confirm(`Update all logs currently marked as "SYSTEM" to show "${currentUser.name}"? This will not affect logs already attributed to other users.`)) {
                                setProcessingClaim(true);
                                try {
                                    await AuditService.updateAllLogsToUser(provider, activeCompany.path, currentUser.name);
                                    await refreshLogs();
                                    alert("System logs claimed successfully!");
                                } catch (e) {
                                    console.error(e);
                                    alert("Failed to update logs.");
                                } finally {
                                    setProcessingClaim(false);
                                }
                            }
                        }}
                        disabled={processingClaim}
                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Claim unattributed (SYSTEM) logs"
                    >
                        {processingClaim ? 'Processing...' : 'Claim History'}
                    </button>
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH LOGS..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 bg-card border border-border rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-[3rem] border border-border shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border bg-muted/30">
                                <th className="px-10 py-6">Timestamp</th>
                                <th className="px-6 py-6">Action</th>
                                <th className="px-6 py-6">Entity</th>
                                <th className="px-6 py-6">Event Description</th>
                                <th className="px-10 py-6 text-right">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-muted/10 transition-colors group">
                                    <td className="px-10 py-5">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            <div className="text-xs font-mono font-bold">
                                                {new Date(log.timestamp).toLocaleDateString()}
                                                <span className="text-muted-foreground ml-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-600' :
                                            log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-600' :
                                                'bg-rose-500/10 text-rose-600'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-3 h-3 text-primary" />
                                            <span className="text-[10px] border border-border px-2 py-0.5 rounded-full font-black uppercase tracking-tighter bg-muted/30">
                                                {log.entityType}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-foreground/80 lowercase italic first-letter:uppercase">
                                        {log.details}
                                    </td>
                                    <td className="px-10 py-5 text-right">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            <Shield className="w-3 h-3 text-muted-foreground" />
                                            {log.userId || 'SYSTEM'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
