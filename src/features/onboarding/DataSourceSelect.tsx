import { Cloud, FolderOpen, ChevronRight } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';

export default function DataSourceSelect() {
    const { initializeStorage } = usePersistence();
    const navigate = useNavigate();

    const handleLocalSelect = async () => {
        try {
            await initializeStorage('local');
            // If successful, navigate to dashboard
            // Note: We might want to check provider.isReady, but init() waits for user selection
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to init storage", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Where should we store your data?</h1>
                    <p className="text-gray-600">Choose how you want to manage your company data.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <button className="group relative bg-white p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-primary-500 hover:shadow-md transition-all text-left">
                        <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                            <Cloud className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">MoneyArc Cloud</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Securely store your data on our servers. Access from anywhere, on any device. Automatic backups included.
                        </p>
                        <div className="flex items-center text-primary-600 text-sm font-medium">
                            Select Cloud Storage <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </button>

                    <button
                        onClick={handleLocalSelect}
                        className="group relative bg-white p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-gray-400 hover:shadow-md transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                            <FolderOpen className="w-6 h-6 text-gray-700" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Local Folder</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Keep your data on your own device. Select a folder on your PC to store all accounting files.
                        </p>
                        <div className="flex items-center text-gray-700 text-sm font-medium">
                            Select Local Folder <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
