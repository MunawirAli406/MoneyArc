import { Cloud, FolderOpen, ChevronRight } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';

export default function DataSourceSelect() {
    const { initializeStorage } = usePersistence();
    // Verified Dark Mode Support: 2026-02-05
    const navigate = useNavigate();

    const handleLocalSelect = async () => {
        try {
            await initializeStorage('local');
            navigate('/select-company');
        } catch (error) {
            console.error("Failed to init storage", error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-foreground mb-3">Where should we store your data?</h1>
                    <p className="text-muted-foreground">Choose how you want to manage your company data.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <button className="group relative bg-card p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-primary-500 hover:shadow-md transition-all text-left">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <Cloud className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">MoneyArc Cloud</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Securely store your data on our servers. Access from anywhere, on any device. Automatic backups included.
                        </p>
                        <div className="flex items-center text-primary text-sm font-medium">
                            Select Cloud Storage <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </button>

                    <button
                        onClick={handleLocalSelect}
                        className="group relative bg-card p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-muted-foreground hover:shadow-md transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 group-hover:bg-muted/80 transition-colors">
                            <FolderOpen className="w-6 h-6 text-foreground" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Local Folder</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Keep your data on your own device. Select a folder on your PC to store all accounting files.
                        </p>
                        <div className="flex items-center text-foreground text-sm font-medium">
                            Select Local Folder <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
