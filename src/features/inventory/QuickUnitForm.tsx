import { useState, useEffect } from 'react';
import { Save, X, Scale } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { motion } from 'framer-motion';
import type { UnitOfMeasure } from '../../services/inventory/types';

interface QuickUnitFormProps {
    onClose: () => void;
    onSuccess: (newUnit: UnitOfMeasure) => void;
    initialName?: string;
}

export default function QuickUnitForm({ onClose, onSuccess, initialName = '' }: QuickUnitFormProps) {
    const { provider, activeCompany } = usePersistence();
    const [name, setName] = useState(initialName);
    const [formalName, setFormalName] = useState('');
    const [decimalPlaces, setDecimalPlaces] = useState(0);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);

    useEffect(() => {
        if (provider && activeCompany) {
            provider.read<UnitOfMeasure[]>('units.json', activeCompany.path)
                .then(data => setUnits(data || []));
        }
    }, [provider, activeCompany]);

    const handleSave = async () => {
        if (!provider || !activeCompany || !name) return;

        try {
            if (units.find(u => u.name.toLowerCase() === name.toLowerCase())) {
                alert('Unit symbol already exists!');
                return;
            }

            const newUnit: UnitOfMeasure = {
                id: Date.now().toString(),
                name,
                formalName,
                decimalPlaces,
                isCompound: false
            };

            await provider.write('units.json', [...units, newUnit], activeCompany.path);

            onSuccess(newUnit);
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to save unit');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-lg uppercase tracking-tight">Quick Create Unit</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Symbol</label>
                            <input
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold uppercase"
                                placeholder="e.g. PCS"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Decimal Places</label>
                            <input
                                type="number"
                                min="0"
                                max="4"
                                value={decimalPlaces}
                                onChange={e => setDecimalPlaces(parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Formal Name</label>
                        <input
                            value={formalName}
                            onChange={e => setFormalName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold"
                            placeholder="e.g. Pieces"
                        />
                    </div>
                </div>

                <div className="p-4 bg-muted/20 border-t border-border flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-google-green text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-google-green/20 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Create
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
