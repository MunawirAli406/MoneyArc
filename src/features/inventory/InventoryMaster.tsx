import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Layers, Scale, TrendingUp, BarChart3, Box } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useNavigate } from 'react-router-dom';
import StockItemList from './StockItemList';
import StockGroupList from './StockGroupList';
import UnitList from './UnitList';

export default function InventoryMaster() {
    const { activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'items' | 'groups' | 'units'>('items');

    const tabs = [
        { id: 'items', label: 'Stock Items', icon: Package },
        { id: 'groups', label: 'Stock Groups', icon: Layers },
        { id: 'units', label: 'Units of Measure', icon: Scale },
    ] as const;

    if (!activeCompany) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-[2.5rem] border border-border/50 shadow-xl m-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                    <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Workspace Required</h3>
                <p className="text-muted-foreground text-sm font-medium mb-6">Select a company to access inventory management.</p>
                <button
                    onClick={() => navigate('/select-company')}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all"
                >
                    Choose Company
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div>
                <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Inventory Master</h1>
                <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] mt-1 opacity-70">Catalog & Stock Management: {activeCompany?.name}</p>
            </div>

            {/* Bento Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Stock Value', val: 'Calculated in List', icon: TrendingUp, color: 'text-google-green', bg: 'bg-google-green/10' },
                    { label: 'Low Stock Items', val: 0, icon: BarChart3, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Stock Categories', val: 0, icon: Layers, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Active Items', val: 0, icon: Box, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass-panel p-6 rounded-3xl border-white/5 shadow-xl relative overflow-hidden group/stat"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{stat.label}</h4>
                        <div className="text-2xl font-black mt-1 tracking-tighter">
                            {stat.val}
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover/stat:scale-110 transition-transform">
                            <stat.icon size={80} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex gap-4 border-b border-border pb-1 no-print overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'items' && <StockItemList />}
                {activeTab === 'groups' && <StockGroupList />}
                {activeTab === 'units' && <UnitList />}
            </div>
        </div>
    );
}
