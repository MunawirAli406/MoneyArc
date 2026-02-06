import { useState, useEffect, useRef } from 'react';
import { X, Save, Layers } from 'lucide-react';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { motion } from 'framer-motion';

interface QuickCategoryFormProps {
    onClose: () => void;
    onSuccess: (categoryName: string) => void;
    initialName?: string;
}

export interface CustomCategory {
    id: string;
    name: string;
}

export default function QuickCategoryForm({ onClose, onSuccess, initialName = '' }: QuickCategoryFormProps) {
    const { provider, activeCompany } = usePersistence();
    const [name, setName] = useState(initialName);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (!provider || !activeCompany) {
            setError("Storage not ready");
            return;
        }

        try {
            // Check existing
            // distinct categories are technically just strings in ledgers, but we might want to track them explicitly
            // For now, let's just save to specific 'custom_categories.json' to track "Masters"
            const customCategories = await provider.read<CustomCategory[]>('custom_categories.json', activeCompany.path) || [];

            if (customCategories.find(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
                setError("Category already exists");
                return;
            }

            const newCategory: CustomCategory = {
                id: Date.now().toString(),
                name: name.trim()
            };

            await provider.write('custom_categories.json', [...customCategories, newCategory], activeCompany.path);

            onSuccess(newCategory.name);
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to save category");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2 text-foreground">
                        <Layers className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-lg">New Category</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                            Category Name
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-lg"
                            placeholder="e.g. Cost Center A"
                        />
                        {error && <p className="text-xs font-bold text-rose-500 ml-1">{error}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-border rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-muted/50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Category
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
