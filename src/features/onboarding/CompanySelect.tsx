import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Search, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';
import type { Company } from '../../services/persistence/types';
import Select from '../../components/ui/Select';
import { INDIAN_STATES } from '../../data/indian_states';
import { BACKGROUNDS, BASE_GRADIENT } from '../../components/layout/backgrounds';

export default function CompanySelect() {
    // Verified Dark Mode Support: 2026-02-05
    const { provider, selectCompany } = usePersistence();
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
        registrationType: 'Regular',
        businessType: 'General'
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
            registrationType: company.registrationType || 'Regular',
            businessType: company.businessType || 'General'
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
            registrationType: 'Regular',
            businessType: 'General'
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
                    await provider.updateCompany(editingCompanyId, companyToEdit.path, newCompany);
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

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background p-8 relative isolate">
            {/* Live Background Preview */}
            {showCreateForm && (
                <div
                    className={`${BASE_GRADIENT} ${BACKGROUNDS[newCompany.businessType || 'General'] || BACKGROUNDS['General']}`}
                    style={{ zIndex: -10 }}
                />
            )}

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
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
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
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {company.financialYear}
                                                </div>
                                                {company.gstin && (
                                                    <div className="px-2 py-0.5 bg-muted rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        GST: {company.gstin}
                                                    </div>
                                                )}
                                                <div className="px-2 py-0.5 bg-primary/10 rounded text-[10px] font-bold uppercase tracking-wider text-primary">
                                                    {company.businessType || 'General'}
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
                                                <input
                                                    type="text"
                                                    value={newCompany.currency}
                                                    onChange={(e) => setNewCompany({ ...newCompany, currency: e.target.value })}
                                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-foreground"
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
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-1">Business Type</label>
                                            <Select
                                                value={newCompany.businessType || 'General'}
                                                onChange={(val) => setNewCompany({ ...newCompany, businessType: val as any })}
                                                options={[
                                                    { value: 'General', label: 'General Business' },
                                                    { value: 'Retail', label: 'Retail & Shop' },
                                                    { value: 'Manufacturing', label: 'Manufacturing & Factory' },
                                                    { value: 'Service', label: 'Service & Consulting' },
                                                    { value: 'Hotel', label: 'Hotel & Hospitality' },
                                                    { value: 'Restaurant', label: 'Restaurant & Cafe' },
                                                    { value: 'Automobile', label: 'Automobile & Garage' },
                                                    { value: 'Textiles', label: 'Textiles & Garments' },
                                                    { value: 'School', label: 'School & Education' },
                                                    { value: 'Hospital', label: 'Hospital & Healthcare' },
                                                    { value: 'RealEstate', label: 'Real Estate & Construction' },
                                                    { value: 'Technology', label: 'Technology & IT' },
                                                    { value: 'Logistics', label: 'Logistics & Transport' },
                                                    { value: 'Agriculture', label: 'Agriculture & Farming' },
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
                                                        ...INDIAN_STATES.map((state) => ({ value: state, label: state }))
                                                    ]}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-foreground mb-1">Country</label>
                                                <input
                                                    type="text"
                                                    value={newCompany.country}
                                                    onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-foreground"
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

                            <div className="flex justify-end gap-3 pt-6 border-t border-border">
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
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
