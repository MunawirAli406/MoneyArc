import { Cloud, FolderOpen, ChevronRight } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CloudAuthModal from '../../components/modals/CloudAuthModal';

export default function DataSourceSelect() {
    const { initializeStorage } = usePersistence();
    const navigate = useNavigate();
    const [authModal, setAuthModal] = useState<{ isOpen: boolean; type: 'google-drive' | 'onedrive' }>({
        isOpen: false,
        type: 'google-drive'
    });

    const handleLocalSelect = async () => {
        try {
            await initializeStorage('local');
            navigate('/select-company');
        } catch (error) {
            console.error("Failed to init storage", error);
        }
    };

    const handleCloudConnect = async (_identity: string, accessKey: string) => {
        // Authenticate with the provided credentials
        try {
            await initializeStorage(authModal.type, accessKey);
            navigate('/select-company');
        } catch (error) {
            throw error;
        }
    };

    const handleCloudSelect = async (type: 'google-drive' | 'onedrive') => {
        setAuthModal({ isOpen: true, type });
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-foreground mb-4 uppercase tracking-tighter">Choose Your Data Hub</h1>
                    <p className="text-muted-foreground font-medium">MoneyArc supports local-first and cloud-sync workflows.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {/* Google Drive */}
                    <button
                        onClick={() => handleCloudSelect('google-drive')}
                        className="glass-card p-6 rounded-[2rem] text-left relative overflow-hidden group border-primary/10 hover:border-primary/30 transition-all shadow-lg"
                    >
                        <div className="w-12 h-12 bg-google-blue/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Cloud className="w-6 h-6 text-google-blue" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-tight">Google Drive</h3>
                        <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed font-medium">
                            Personal cloud sync. Works across all your devices including mobile.
                        </p>
                        <div className="flex items-center text-google-blue text-[9px] font-black uppercase tracking-widest">
                            Connect Drive <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                    </button>

                    {/* OneDrive */}
                    <button
                        onClick={() => handleCloudSelect('onedrive')}
                        className="glass-card p-6 rounded-[2rem] text-left relative overflow-hidden group border-primary/10 hover:border-primary/30 transition-all shadow-lg"
                    >
                        <div className="w-12 h-12 bg-google-green/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Cloud className="w-6 h-6 text-google-green" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-tight">OneDrive</h3>
                        <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed font-medium">
                            Microsoft ecosystem sync. Secure and integrated with Office.
                        </p>
                        <div className="flex items-center text-google-green text-[9px] font-black uppercase tracking-widest">
                            Connect OneDrive <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                    </button>

                    {/* Local Vault */}
                    <button
                        onClick={handleLocalSelect}
                        className="glass-card p-6 rounded-[2rem] text-left relative overflow-hidden group border-amber-500/10 hover:border-amber-500/30 transition-all shadow-lg"
                    >
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FolderOpen className="w-6 h-6 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-tight">Local Vault</h3>
                        <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed font-medium">
                            Absolute privacy. Data stays on your machine. Offline first.
                        </p>
                        <div className="flex items-center text-amber-500 text-[9px] font-black uppercase tracking-widest">
                            Select Folder <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                    </button>
                </div>
            </div>

            <CloudAuthModal
                isOpen={authModal.isOpen}
                onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
                type={authModal.type}
                onConnect={handleCloudConnect}
            />
        </div>
    );
}
