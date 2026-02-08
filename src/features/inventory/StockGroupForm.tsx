import { useState, useEffect } from 'react';
import { Save, Layers } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { StockGroup } from '../../services/inventory/types';
import Select from '../../components/ui/Select';

export default function StockGroupForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { provider, activeCompany } = usePersistence();
    const [groups, setGroups] = useState<StockGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        parentGroupId: ''
    });

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;
            setIsLoading(true);
            try {
                const groupData = await provider.read<StockGroup[]>('stock_groups.json', activeCompany.path);
                setGroups(groupData || []);

                if (id && groupData) {
                    const group = groupData.find(g => g.id === id);
                    if (group) {
                        setFormData({
                            name: group.name,
                            parentGroupId: group.parentGroupId || ''
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to load stock groups", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id, provider, activeCompany]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider || !activeCompany) return;

        try {
            const newGroup: StockGroup = {
                id: id || Date.now().toString(),
                name: formData.name,
                parentGroupId: formData.parentGroupId || undefined
            };

            let updated;
            if (id) {
                updated = groups.map(g => g.id === id ? newGroup : g);
            } else {
                updated = [...groups, newGroup];
            }

            await provider.write('stock_groups.json', updated, activeCompany.path);
            navigate('/inventory/groups');
        } catch (error) {
            console.error('Failed to save group:', error);
            alert('Failed to save group.');
        }
    };

    if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading Group...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
                        {id ? 'Alter Group' : 'Establish Group'}
                    </h1>
                    <p className="text-muted-foreground font-medium">Categorize stock items for hierarchical reporting.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-card rounded-3xl p-10 border border-border shadow-sm space-y-8">
                <div className="flex items-center gap-2 text-primary mb-2">
                    <Layers className="w-4 h-4" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Group Definition</h3>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Group Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-5 py-4 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-xl uppercase"
                            placeholder="e.g. ELECTRONICS, HARDWARE"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Parent Group (Optional)</label>
                        <Select
                            value={formData.parentGroupId}
                            onChange={(val) => setFormData({ ...formData, parentGroupId: val })}
                            options={[
                                { value: '', label: 'Primary' },
                                ...groups.filter(g => g.id !== id).map(g => ({ value: g.id, label: g.name }))
                            ]}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => navigate('/inventory/groups')}
                        className="flex-1 px-8 py-4 border border-border rounded-2xl font-black uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-[2] bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        <span>{id ? 'Update Group' : 'Save Group'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
