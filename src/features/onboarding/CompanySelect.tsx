import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Search, Calendar, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';
import type { Company } from '../../services/persistence/types';
import Select from '../../components/ui/Select';
import { CURRENCIES } from '../../data/currencies';
import { COUNTRIES, COUNTRIES_DATA } from '../../data/countries';

export default function CompanySelect() {
    // Verified Dark Mode Support: 2026-02-05
    const { provider, selectCompany, activeCompany } = usePersistence();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
    const [newCompany, setNewCompany] = useState<Omit<Company, 'id' | 'path'>>({
        name: '',
        financialYear: '2025-26',
        gstin: '',
        address: '',
        state: 'Maharashtra',
        country: 'India',
        phone: '',
        email: '',
        website: '',
        currency: 'INR',
        symbol: '₹',
        registrationType: 'Regular'
    });
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const loadCompanies = useCallback(async () => {
        if (!provider) return;
        setIsLoading(true);
        setError(null);
        try {
            await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, 800); });
            const list = await provider.listCompanies();
            setCompanies(list);
        } catch (error) {
            console.error("Failed to load companies", error);
            setError("Failed to load companies. Please retry.");
        } finally {
            setIsLoading(false);
        }
    }, [provider]);

    useEffect(() => {
        if (!provider) {
            navigate('/select-source');
            return;
        }
        loadCompanies();
    }, [provider, loadCompanies, navigate]);

    const handleSelect = async (company: Company) => {
        try {
            await selectCompany(company);
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to select company", err);
            setError("Failed to select company.");
        }
    };

    const handleEdit = (company: Company) => {
        setNewCompany({
            name: company.name,
            financialYear: company.financialYear,
            gstin: company.gstin || '',
            address: company.address || '',
            state: company.state || '',
            country: company.country || 'India',
            phone: company.phone || '',
            email: company.email || '',
            website: company.website || '',
            currency: company.currency || 'INR',
            symbol: company.symbol || '₹',
            registrationType: company.registrationType || 'Regular'
        });
        setEditingCompanyId(company.id);
        setError(null);
        setShowCreateForm(true);
    };

    const resetForm = () => {
        setNewCompany({
            name: '',
            financialYear: '2025-26',
            gstin: '',
            address: '',
            state: 'Maharashtra',
            country: 'India',
            phone: '',
            email: '',
            website: '',
            currency: 'INR',
            symbol: '₹',
            registrationType: 'Regular'
        });
        setEditingCompanyId(null);
        setError(null);
        setShowCreateForm(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider) return;
        setIsLoading(true);
        setError(null);
        try {
            if (editingCompanyId) {
                const companyToEdit = companies.find(c => c.id === editingCompanyId);
                if (companyToEdit) {
                    const updated = await provider.updateCompany(editingCompanyId, companyToEdit.path, newCompany);
                    if (activeCompany?.id === editingCompanyId) {
                        await selectCompany(updated);
                    }
                }
            } else {
                await provider.createCompany(newCompany);
            }
            await loadCompanies();
            resetForm();
        } catch (error) {
            console.error("Failed to save company", error);
            setError((error as Error).message || "Failed to save company");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCompany = async () => {
        if (!editingCompanyId || !provider) return;

        const companyToDelete = companies.find(c => c.id === editingCompanyId);
        if (!companyToDelete) return;

        if (!confirm(`Are you sure you want to PERMANENTLY delete "${companyToDelete.name}"? This action cannot be undone and all data will be lost.`)) {
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await provider.deleteCompany(editingCompanyId, companyToDelete.path);
            if (activeCompany?.id === editingCompanyId) {
                await selectCompany(null);
            }
            await loadCompanies();
            resetForm();
        } catch (error) {
            console.error("Failed to delete company", error);
            setError((error as Error).message || "Failed to delete company");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background p-8 relative isolate">

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                                <Building2 size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">Select Company</h1>
                        </div>
                        <p className="text-muted-foreground">Choose a company to start accounting</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-google-green text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-google-green/20 transition-all active:scale-95 shadow-sm"
                    >
                        <Plus size={20} />
                        Create New
                    </button>
                </div>

                {!showCreateForm ? (
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm text-foreground"
                            />
                        </div>

                        {isLoading && companies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border shadow-sm">
                                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                                <p className="text-muted-foreground">Loading your companies...</p>
                            </div>
                        ) : filteredCompanies.length === 0 ? (
                            <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                                    <Building2 size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-1">No Companies Found</h3>
                                <p className="text-muted-foreground">Create your first company to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredCompanies.map((company) => (
                                    <div
                                        key={company.id}
                                        className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary-500 hover:shadow-lg transition-all cursor-pointer"
                                    >
                                        <div onClick={() => handleSelect(company)}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                                    <Building2 size={24} />
                                                </div>
                                                <ChevronRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <h3 className="text-lg font-bold text-foreground mb-1">{company.name}</h3>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pr-24">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {company.financialYear}
                                                </div>
                                                {company.gstin && (
                                                    <div className="px-2 py-0.5 bg-muted rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                        GST: {company.gstin}
                                                    </div>
                                                )}
                                                <div className="px-2 py-0.5 bg-accent-500/10 rounded text-[10px] font-black tracking-wider text-accent-600 dark:text-accent-400 whitespace-nowrap">
                                                    {company.currency} ({company.symbol})
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(company);
                                            }}
                                            className="absolute bottom-6 right-6 text-primary p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 rounded-lg text-sm font-medium"
                                        >
                                            Settings
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border bg-muted/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground">
                                {editingCompanyId ? 'Edit Company' : 'Create New Company'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-8">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-bold">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Basic Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-1">Company Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newCompany.name}
                                                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-foreground"
                                                placeholder="e.g. Acme Industries"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-foreground mb-1">Financial Year</label>
                                                <Select
                                                    value={newCompany.financialYear}
                                                    onChange={(val) => setNewCompany({ ...newCompany, financialYear: val })}
                                                    options={[
                                                        { value: '2025-26', label: '2025-26' },
                                                        { value: '2024-25', label: '2024-25' },
                                                    ]}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-foreground mb-1">Currency</label>
                                                <Select
                                                    value={newCompany.currency}
                                                    onChange={(val) => {
                                                        const currency = CURRENCIES.find(c => c.code === val);
                                                        setNewCompany({
                                                            ...newCompany,
                                                            currency: val,
                                                            symbol: currency?.symbol || '₹'
                                                        });
                                                    }}
                                                    options={CURRENCIES.map(c => ({ value: c.code, label: c.label }))}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Compliance & Tax</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-1">GSTIN</label>
                                            <input
                                                type="text"
                                                value={newCompany.gstin}
                                                onChange={(e) => setNewCompany({ ...newCompany, gstin: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all uppercase text-foreground"
                                                placeholder="27AAAAA0000A1Z5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-1">Registration Type</label>
                                            <Select
                                                value={newCompany.registrationType || 'Regular'}
                                                onChange={(val) => setNewCompany({ ...newCompany, registrationType: val as any })}
                                                options={[
                                                    { value: 'Regular', label: 'Regular' },
                                                    { value: 'Composition', label: 'Composition' },
                                                    { value: 'Unregistered', label: 'Unregistered' },
                                                ]}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Address & Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-1">Full Address</label>
                                        <textarea
                                            rows={4}
                                            value={newCompany.address}
                                            onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none text-foreground"
                                            placeholder="Unit No. 123, Business Park..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-foreground mb-1">State</label>
                                                <Select
                                                    value={newCompany.state || ''}
                                                    onChange={(val) => setNewCompany({ ...newCompany, state: val })}
                                                    options={[
                                                        { value: '', label: 'Select State' },
                                                        ...(COUNTRIES_DATA[newCompany.country] || []).map((state) => ({ value: state, label: state }))
                                                    ]}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-foreground mb-1">Country</label>
                                                <Select
                                                    value={newCompany.country}
                                                    onChange={(val) => {
                                                        const states = COUNTRIES_DATA[val] || [];
                                                        setNewCompany({
                                                            ...newCompany,
                                                            country: val,
                                                            state: states.length > 0 ? states[0] : ''
                                                        });
                                                    }}
                                                    options={COUNTRIES.map(country => ({ value: country, label: country }))}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-foreground mb-1">Phone</label>
                                                <input
                                                    type="text"
                                                    value={newCompany.phone}
                                                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-foreground mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={newCompany.email}
                                                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-foreground"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-border">
                                <div>
                                    {editingCompanyId && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteCompany}
                                            disabled={isLoading}
                                            className="px-4 py-2 text-rose-500 font-bold hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Delete Company
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-2.5 text-muted-foreground font-bold hover:bg-muted rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-8 py-2.5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                                        {editingCompanyId ? 'Update Company' : 'Create Company'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
