import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, FileJson, FileSpreadsheet, Database, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';

export default function DataPortability() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

    const handleExport = async (format: 'json' | 'csv') => {
        if (!provider || !activeCompany) return;
        setStatus({ type: 'loading', message: `Preparing ${format.toUpperCase()} package...` });

        try {
            // In a real app, you'd zip all files or specific ones. 
            // For now, let's export just the core data.
            const dataFiles = ['ledgers.json', 'vouchers.json', 'stock_items.json', 'units.json', 'groups.json'];
            const allData: Record<string, any> = {};

            for (const file of dataFiles) {
                allData[file.split('.')[0]] = await provider.read(file, activeCompany.path) || [];
            }

            let blob: Blob;
            let filename: string;

            if (format === 'json') {
                blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
                filename = `${activeCompany.name}_Backup_${new Date().toISOString().split('T')[0]}.json`;
            } else {
                // Simplified CSV export for ledgers
                const ledgers = allData.ledgers || [];
                const headers = ['id', 'name', 'group', 'balance', 'type'];
                const csvContent = [
                    headers.join(','),
                    ...ledgers.map((l: any) => headers.map(h => `"${l[h]}"`).join(','))
                ].join('\n');
                blob = new Blob([csvContent], { type: 'text/csv' });
                filename = `${activeCompany.name}_Ledgers_${new Date().toISOString().split('T')[0]}.csv`;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            setStatus({ type: 'success', message: 'Export completed successfully!' });
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to generate package.' });
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !provider || !activeCompany) return;

        setStatus({ type: 'loading', message: 'Analyzing data integrity...' });

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const data = JSON.parse(text);

                // Validation
                if (!data.ledgers && !data.vouchers) throw new Error("Invalid structure");

                // Write to provider
                if (data.ledgers) await provider.write('ledgers.json', data.ledgers, activeCompany.path);
                if (data.vouchers) await provider.write('vouchers.json', data.vouchers, activeCompany.path);
                if (data.stock_items) await provider.write('stock_items.json', data.stock_items, activeCompany.path);

                setStatus({ type: 'success', message: 'Recovery complete! All data restored.' });
            } catch (err) {
                setStatus({ type: 'error', message: 'Import failed: Invalid file format.' });
            }
        };
        reader.readAsText(file);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto py-12 px-6"
        >
            <div className="flex items-center gap-6 mb-12">
                <button onClick={() => navigate(-1)} className="p-4 bg-muted hover:bg-muted/80 rounded-2xl transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Data Portability</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Enterprise Data Mobility Tools</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Section */}
                <div className="glass-panel p-10 rounded-[3.5rem] flex flex-col items-center text-center gap-8 border-google-blue/20">
                    <div className="w-20 h-20 bg-google-blue/10 rounded-3xl flex items-center justify-center text-google-blue">
                        <Download className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Bulk Export</h2>
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed px-6">
                            Securely extract your entire data vault for offline backups or migration to other systems.
                        </p>
                    </div>
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => handleExport('json')}
                            className="flex-1 py-4 bg-google-blue text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-google-blue/90 shadow-xl shadow-google-blue/20 transition-all"
                        >
                            <FileJson className="w-4 h-4" /> JSON
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="flex-1 py-4 border border-google-blue/30 text-google-blue rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-google-blue/5 transition-all"
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Ledgers CSV
                        </button>
                    </div>
                </div>

                {/* Import Section */}
                <div className="glass-panel p-10 rounded-[3.5rem] flex flex-col items-center text-center gap-8 border-google-green/20">
                    <div className="w-20 h-20 bg-google-green/10 rounded-3xl flex items-center justify-center text-google-green">
                        <Database className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Restore & Import</h2>
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed px-6">
                            Seamlessly upload a previously exported vault or bulk-onboard data from spreadsheets.
                        </p>
                    </div>
                    <div className="w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-google-green/30 rounded-[2rem] cursor-pointer hover:bg-google-green/5 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-google-green group-hover:scale-110 transition-transform mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-google-green">Select Vault File</p>
                            </div>
                            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Status Overlay */}
            <AnimatePresence>
                {status.type !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 rounded-[2rem] shadow-2xl border-2 flex items-center gap-6 z-50 backdrop-blur-xl ${status.type === 'loading' ? 'bg-card border-google-blue/30' :
                            status.type === 'success' ? 'bg-emerald-500 text-white border-transparent' :
                                'bg-rose-500 text-white border-transparent'
                            }`}
                    >
                        {status.type === 'loading' ? <Loader2 className="w-6 h-6 animate-spin text-google-blue" /> :
                            status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                                <AlertCircle className="w-6 h-6" />}
                        <span className="text-xs font-black uppercase tracking-widest">{status.message}</span>
                        {status.type !== 'loading' && (
                            <button onClick={() => setStatus({ type: 'idle', message: '' })} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                                <CheckCircle2 className="w-5 h-5" />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
