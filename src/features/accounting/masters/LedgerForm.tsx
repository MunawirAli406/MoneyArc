import { useState, useEffect } from 'react';
import { Save, CheckCircle2, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import type { Ledger } from '../../../services/accounting/ReportService';
import QuickGroupForm, { type CustomGroup } from './QuickGroupForm';
import QuickCategoryForm, { type CustomCategory } from './QuickCategoryForm';
import { AccountGroupManager } from '../../../services/accounting/ReportService';

const SYSTEM_GROUPS = [
    'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Sundry Creditors',
    'Sales Accounts', 'Purchase Accounts', 'Direct Expenses', 'Indirect Expenses',
    'Fixed Assets', 'Duties & Taxes', 'Loans (Liability)', 'Direct Incomes', 'Indirect Incomes',
    'Capital Account', 'Stock-in-hand', 'Current Assets', 'Current Liabilities',
    'Loans & Advances (Asset)', 'Reserves & Surplus'
];

export default function LedgerForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { provider, activeCompany } = usePersistence();

    const [availableGroups, setAvailableGroups] = useState<string[]>(SYSTEM_GROUPS);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        group: '',
        category: '',
        opBalance: '',
        balanceType: 'Dr',
        mailingName: '',
        address: '',
        state: activeCompany?.state || '',
        gstin: '',
        isGstEnabled: false
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                // Load Custom Groups
                try {
                    const custom = await provider.read<CustomGroup[]>('custom_groups.json', activeCompany.path) || [];
                    const customNames = custom.map(c => c.name);

                    // Register them to manager for this session
                    custom.forEach(c => AccountGroupManager.registerGroup(c.name, c.parentType));

                    setAvailableGroups([...SYSTEM_GROUPS, ...customNames].sort());

                    // Load Categories
                    const customCats = await provider.read<CustomCategory[]>('custom_categories.json', activeCompany.path) || [];
                    const customCatNames = customCats.map(c => c.name);

                    // Also get unique categories from existing ledgers to populate the list if valid
                    const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];
                    const ledgerCats = Array.from(new Set(ledgers.map(l => l.category).filter(Boolean))) as string[];

                    const allCategories = Array.from(new Set([...customCatNames, ...ledgerCats])).sort();
                    setAvailableCategories(allCategories);
                } catch (e) {
                    console.error('Failed to load custom groups', e);
                }
            }

            if (id && provider && activeCompany) {
                setIsLoading(true);
                try {
                    const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path);
                    const ledger = ledgers?.find(l => l.id === id);
                    if (ledger) {
                        setFormData({
                            name: ledger.name,
                            group: ledger.group,
                            category: ledger.category || '',
                            opBalance: Math.abs(ledger.balance).toString(),
                            balanceType: ledger.type,
                            mailingName: ledger.name,
                            address: ledger.address || '',
                            state: ledger.state || '',
                            gstin: ledger.gstin || '',
                            isGstEnabled: ledger.isGstEnabled || false
                        });
                    }
                } catch (e) {
                    console.error("Failed to load ledger", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadData();
    }, [id, provider, activeCompany]);

    const handleSave = async () => {
        if (!provider || !activeCompany) {
            alert("Storage not initialized or company not selected!");
            return;
        }

        try {
            const existingLedgers = (await provider.read<Ledger[]>('ledgers.json', activeCompany.path)) || [];

            const ledgerData: Ledger = {
                id: id || Date.now().toString(),
                name: formData.name,
                group: formData.group,
                category: formData.category,
                balance: parseFloat(formData.opBalance) || 0,
                type: formData.balanceType as 'Dr' | 'Cr',
                gstin: formData.gstin,
                address: formData.address,
                state: formData.state,
                isGstEnabled: formData.isGstEnabled
            };

            let updatedLedgers;
            if (id) {
                updatedLedgers = existingLedgers.map(l => l.id === id ? ledgerData : l);
            } else {
                updatedLedgers = [...existingLedgers, ledgerData];
            }

            await provider.write('ledgers.json', updatedLedgers, activeCompany.path);
            navigate('/ledgers');
        } catch (error) {
            console.error('Failed to save ledger:', error);
            alert('Failed to save ledger.');
        }
    };

    if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading Ledger...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
                        {id ? 'Alter Ledger' : 'Establish Ledger'}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {id ? `Modifying ${formData.name}` : 'Add a new financial account to your workspace.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/ledgers')}
                        className="px-6 py-3 border border-border rounded-xl font-bold uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        <span>{id ? 'Update Ledger' : 'Save Ledger'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Basic Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Ledger Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-lg"
                                placeholder="e.g. Gotham City Bank"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Under Group</label>
                                    <button
                                        onClick={() => setShowGroupModal(true)}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> New (Alt+C)
                                    </button>
                                </div>
                                <div className="relative">
                                    <select
                                        value={formData.group}
                                        onChange={(e) => {
                                            const newGroup = e.target.value;
                                            if (newGroup === 'CREATE_NEW') {
                                                setShowGroupModal(true);
                                            } else {
                                                // Auto-detect Balance Type
                                                const isAssetOrExpense = AccountGroupManager.isAssetOrExpense(newGroup);
                                                setFormData({
                                                    ...formData,
                                                    group: newGroup,
                                                    balanceType: isAssetOrExpense ? 'Dr' : 'Cr'
                                                });
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.altKey && e.key.toLowerCase() === 'c') {
                                                e.preventDefault();
                                                setShowGroupModal(true);
                                            }
                                        }}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold appearance-none"
                                    >
                                        <option value="">Select Group</option>
                                        <option value="CREATE_NEW" className="text-primary font-bold">+ Create New Group</option>
                                        <option disabled>──────────</option>
                                        {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Category (Optional)</label>
                                    <button
                                        onClick={() => setShowCategoryModal(true)}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> New (Alt+C)
                                    </button>
                                </div>
                                <div className="relative">
                                    <select
                                        value={formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === 'CREATE_NEW') {
                                                setShowCategoryModal(true);
                                            } else {
                                                setFormData({ ...formData, category: e.target.value });
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.altKey && e.key.toLowerCase() === 'c') {
                                                e.preventDefault();
                                                setShowCategoryModal(true);
                                            }
                                        }}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold appearance-none"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="CREATE_NEW" className="text-primary font-bold">+ Create New Category</option>
                                        <option disabled>──────────</option>
                                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Opening Balance</label>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    value={formData.opBalance}
                                    onChange={(e) => setFormData({ ...formData, opBalance: e.target.value })}
                                    className="flex-1 px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                                    placeholder="0.00"
                                />
                                <select
                                    value={formData.balanceType}
                                    onChange={(e) => setFormData({ ...formData, balanceType: e.target.value })}
                                    className="w-32 px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-black text-center"
                                >
                                    <option value="Dr">Debit</option>
                                    <option value="Cr">Credit</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6 text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Compliance Details</h3>
                            <button
                                onClick={() => setFormData({ ...formData, isGstEnabled: !formData.isGstEnabled })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${formData.isGstEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                            >
                                <CheckCircle2 className={`w-4 h-4 ${formData.isGstEnabled ? 'opacity-100' : 'opacity-30'}`} />
                                GST / VAT Enabled
                            </button>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${formData.isGstEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">GSTIN Number</label>
                                <input
                                    type="text"
                                    value={formData.gstin}
                                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold uppercase"
                                    placeholder="27AAACR1224A1Z1"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Registration State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                                    placeholder="State Name"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mailing Details */}
                <div className="space-y-8">
                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6 h-full">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Mailing Address</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Mailing Name</label>
                                <input
                                    type="text"
                                    value={formData.mailingName}
                                    onChange={(e) => setFormData({ ...formData, mailingName: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                                    placeholder="Print name..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Permanent Address</label>
                                <textarea
                                    rows={6}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold resize-none"
                                    placeholder="Full street address..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {showGroupModal && (
                    <QuickGroupForm
                        onClose={() => setShowGroupModal(false)}
                        initialName=""
                        onSuccess={(newGroupName) => {
                            setAvailableGroups(prev => [...prev, newGroupName].sort());
                            setFormData({ ...formData, group: newGroupName });
                        }}
                    />
                )}

                {showCategoryModal && (
                    <QuickCategoryForm
                        onClose={() => setShowCategoryModal(false)}
                        initialName=""
                        onSuccess={(newCatName) => {
                            setAvailableCategories(prev => [...prev, newCatName].sort());
                            setFormData({ ...formData, category: newCatName });
                        }}
                    />
                )}
            </div>
        </div>
    );
}
