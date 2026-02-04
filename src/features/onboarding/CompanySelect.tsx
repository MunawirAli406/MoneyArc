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
    const [newCompany, setNewCompany] = useState<Omit<Company, 'id' | 'path'>>({
        name: '',
        financialYear: '2025-26',
        gstin: '',
        address: '',
        state: 'Maharashtra',
        registrationType: 'Regular'
    });
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
            const created = await provider.createCompany(newCompany);
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight uppercase">Select Company</h1>
                    <p className="text-muted-foreground font-medium">Choose a workspace to manage your financial arc.</p>
                </div>

                <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
                    <div className="p-8 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                            />
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="ml-6 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            New Company
                        </button>
                    </div>

                    <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                        {isLoading ? (
                            <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
                                <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
                                <p className="font-bold uppercase tracking-widest text-xs">Accessing Ledgers...</p>
                            </div>
                        ) : filteredCompanies.length > 0 ? (
                            filteredCompanies.map((company) => (
                                <button
                                    key={company.id}
                                    onClick={() => handleSelect(company)}
                                    className="w-full p-8 flex items-center justify-between hover:bg-muted/30 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                            <Building2 className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight">
                                                {company.name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    FY: {company.financialYear}
                                                </span>
                                                <span className="w-1.5 h-1.5 bg-border rounded-full"></span>
                                                <span>GSTIN: {company.gstin || 'UNREGISTERED'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active State</p>
                                            <p className="text-sm font-bold text-foreground">{company.state || 'N/A'}</p>
                                        </div>
                                        <ChevronRight className="w-8 h-8 text-border group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-32 text-center text-muted-foreground">
                                <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Building2 className="w-10 h-10" />
                                </div>
                                <p className="text-xl font-black text-foreground mb-2">No Companies Found</p>
                                <p className="text-sm font-medium">Initialize a new company to begin your accounting arc.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Company Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-border">
                        <div className="p-10 border-b border-border bg-muted/30">
                            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Establish Company</h2>
                            <p className="font-medium text-muted-foreground mt-1">Define your organization's core financial identity.</p>
                        </div>
                        <form onSubmit={handleCreate} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Company Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newCompany.name}
                                        onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-foreground"
                                        placeholder="e.g., MoneyArc Tech Solutions"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Financial Year</label>
                                    <select
                                        value={newCompany.financialYear}
                                        onChange={(e) => setNewCompany({ ...newCompany, financialYear: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-foreground appearance-none"
                                    >
                                        <option value="2024-25">2024-25</option>
                                        <option value="2025-26">2025-26</option>
                                        <option value="2026-27">2026-27</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">GSTIN Number</label>
                                    <input
                                        type="text"
                                        value={newCompany.gstin}
                                        onChange={(e) => setNewCompany({ ...newCompany, gstin: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-foreground uppercase"
                                        placeholder="27AAACR1234A1Z1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Registration Type</label>
                                    <select
                                        value={newCompany.registrationType}
                                        onChange={(e) => setNewCompany({ ...newCompany, registrationType: e.target.value as any })}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-foreground appearance-none"
                                    >
                                        <option value="Regular">Regular</option>
                                        <option value="Composition">Composition</option>
                                        <option value="Unregistered">Unregistered</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Business Address</label>
                                    <textarea
                                        value={newCompany.address}
                                        onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-foreground resize-none"
                                        rows={2}
                                        placeholder="Enter full registered address..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-8 py-4 border border-border rounded-2xl font-black uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Workspace'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
