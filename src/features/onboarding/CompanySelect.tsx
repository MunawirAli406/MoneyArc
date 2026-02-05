import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Search, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';
import type { Company } from '../../services/persistence/types';

export default function CompanySelect() {
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
        registrationType: 'Regular'
    });
    const navigate = useNavigate();

    const loadCompanies = useCallback(async () => {
        if (!provider) return;
        setIsLoading(true);
        try {
            // Simulate network delay
            await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, 800); });
            const list = await provider.listCompanies();
            setCompanies(list);
        } catch (error) {
            console.error("Failed to load companies", error);
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

    const handleSelect = (company: Company) => {
        selectCompany(company);
        navigate('/dashboard');
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
        setShowCreateForm(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider) return;
        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                                <Building2 size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Select Company</h1>
                        </div>
                        <p className="text-gray-600">Choose a company to start accounting</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        Create New
                    </button>
                </div>

                {!showCreateForm ? (
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {isLoading && companies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
                                <p className="text-gray-500">Loading your companies...</p>
                            </div>
                        ) : filteredCompanies.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Building2 size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Companies Found</h3>
                                <p className="text-gray-500">Create your first company to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredCompanies.map((company) => (
                                    <div
                                        key={company.id}
                                        className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-500 hover:shadow-lg transition-all cursor-pointer"
                                    >
                                        <div onClick={() => handleSelect(company)}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-50 transition-colors">
                                                    <Building2 size={24} />
                                                </div>
                                                <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{company.name}</h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {company.financialYear}
                                                </div>
                                                {company.gstin && (
                                                    <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        GST: {company.gstin}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(company);
                                            }}
                                            className="absolute bottom-6 right-6 text-primary-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-50 rounded-lg text-sm font-medium"
                                        >
                                            Settings
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCompanyId ? 'Edit Company' : 'Create New Company'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Basic Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Company Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newCompany.name}
                                                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                placeholder="e.g. Acme Industries"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Financial Year</label>
                                                <select
                                                    value={newCompany.financialYear}
                                                    onChange={(e) => setNewCompany({ ...newCompany, financialYear: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                >
                                                    <option value="2025-26">2025-26</option>
                                                    <option value="2024-25">2024-25</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Currency</label>
                                                <input
                                                    type="text"
                                                    value={newCompany.currency}
                                                    onChange={(e) => setNewCompany({ ...newCompany, currency: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Compliance & Tax</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">GSTIN</label>
                                            <input
                                                type="text"
                                                value={newCompany.gstin}
                                                onChange={(e) => setNewCompany({ ...newCompany, gstin: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all uppercase"
                                                placeholder="27AAAAA0000A1Z5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Registration Type</label>
                                            <select
                                                value={newCompany.registrationType}
                                                onChange={(e) => setNewCompany({ ...newCompany, registrationType: e.target.value as 'Regular' | 'Composition' | 'Unregistered' })}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            >
                                                <option value="Regular">Regular</option>
                                                <option value="Composition">Composition</option>
                                                <option value="Unregistered">Unregistered</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Address & Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Address</label>
                                        <textarea
                                            rows={4}
                                            value={newCompany.address}
                                            onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                            placeholder="Unit No. 123, Business Park..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                                                <input
                                                    type="text"
                                                    value={newCompany.state}
                                                    onChange={(e) => setNewCompany({ ...newCompany, state: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Country</label>
                                                <input
                                                    type="text"
                                                    value={newCompany.country}
                                                    onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                                                <input
                                                    type="text"
                                                    value={newCompany.phone}
                                                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={newCompany.email}
                                                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-2.5 bg-primary-600 text-white font-black uppercase tracking-widest text-xs rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2"
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
