import { useState, useEffect } from 'react';
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
    const [newCompany, setNewCompany] = useState({ name: '', financialYear: '2025-26' });
    const navigate = useNavigate();

    useEffect(() => {
        if (!provider) {
            navigate('/select-source');
            return;
        }
        loadCompanies();
    }, [provider]);

    const loadCompanies = async () => {
        if (!provider) return;
        setIsLoading(true);
        try {
            const list = await provider.listCompanies();
            setCompanies(list);
        } catch (error) {
            console.error("Failed to load companies", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (company: Company) => {
        selectCompany(company);
        navigate('/dashboard');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider) return;
        setIsLoading(true);
        try {
            const created = await provider.createCompany(newCompany.name, newCompany.financialYear);
            handleSelect(created);
        } catch (error) {
            console.error("Failed to create company", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Select Company</h1>
                    <p className="text-gray-600">Choose a company to start managing your accounts.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="ml-4 flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Company
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
                                <p>Loading companies...</p>
                            </div>
                        ) : filteredCompanies.length > 0 ? (
                            filteredCompanies.map((company) => (
                                <button
                                    key={company.id}
                                    onClick={() => handleSelect(company)}
                                    className="w-full p-6 flex items-center justify-between hover:bg-primary-50/50 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                                                {company.name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    FY: {company.financialYear}
                                                </span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>ID: {company.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))
                        ) : (
                            <div className="py-20 text-center text-gray-500">
                                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">No companies found</p>
                                <p className="text-sm">Create a new company to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Company Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Create New Company</h2>
                            <p className="text-sm text-gray-500">Set up your accounting workspace</p>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newCompany.name}
                                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g., Acme Corp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
                                <select
                                    value={newCompany.financialYear}
                                    onChange={(e) => setNewCompany({ ...newCompany, financialYear: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="2024-25">2024-25</option>
                                    <option value="2025-26">2025-26</option>
                                    <option value="2026-27">2026-27</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Company'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
