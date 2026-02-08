import { Cloud, FolderOpen, ChevronRight, Github } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import GitHubImportModal from './GitHubImportModal';

export default function DataSourceSelect() {
    const { initializeStorage } = usePersistence();
    const navigate = useNavigate();
    const [showGithubModal, setShowGithubModal] = useState(false);

    const handleLocalSelect = async () => {
        try {
            await initializeStorage('local');
            navigate('/select-company');
        } catch (error) {
            console.error("Failed to init storage", error);
        }
    };

    const handleGithubImport = async (config: any) => {
        try {
            await initializeStorage('github', config);
            navigate('/select-company');
        } catch (error) {
            console.error("Failed to init github storage", error);
            throw error;
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-foreground mb-4 uppercase tracking-tighter">Choose Your Data Hub</h1>
                    <p className="text-muted-foreground font-medium">MoneyArc supports local-first and cloud-sync workflows.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <button className="glass-card p-8 rounded-[2rem] text-left relative overflow-hidden group">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Cloud className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 uppercase tracking-tight">Cloud Sync</h3>
                        <p className="text-xs text-muted-foreground mb-6 leading-relaxed font-medium">
                            Premium encrypted backup. Access your accounts from any device with zero configuration.
                        </p>
                        <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest">
                            Coming Soon <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>

                    <button
                        onClick={handleLocalSelect}
                        className="glass-card p-8 rounded-[2rem] text-left relative overflow-hidden group border-primary/20"
                    >
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FolderOpen className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 uppercase tracking-tight">Local Vault</h3>
                        <p className="text-xs text-muted-foreground mb-6 leading-relaxed font-medium">
                            Absolute privacy. Your data stays on your machine. Full offline capability and direct file access.
                        </p>
                        <div className="flex items-center text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                            Select Folder <ChevronRight className="w-4 h-4 ml-1 opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>

                    <button
                        onClick={() => setShowGithubModal(true)}
                        className="glass-card p-8 rounded-[2rem] text-left relative overflow-hidden group"
                    >
                        <div className="w-14 h-14 bg-foreground/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Github className="w-8 h-8 text-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 uppercase tracking-tight">GitHub Import</h3>
                        <p className="text-xs text-muted-foreground mb-6 leading-relaxed font-medium">
                            Import existing business data from a GitHub repository. Ideal for developers and shared datasets.
                        </p>
                        <div className="flex items-center text-foreground text-[10px] font-black uppercase tracking-widest">
                            Source Repo <ChevronRight className="w-4 h-4 ml-1 opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>
                </div>
            </div>

            <GitHubImportModal
                isOpen={showGithubModal}
                onClose={() => setShowGithubModal(false)}
                onImport={handleGithubImport}
            />
        </div>
    );
}
