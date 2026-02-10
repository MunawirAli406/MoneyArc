import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Layers, Scale, Building2 } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import StockItemList from './StockItemList';
import StockGroupList from './StockGroupList';
import UnitList from './UnitList';

export default function InventoryMaster() {
    const { activeCompany, provider } = usePersistence();
    const [activeTab, setActiveTab] = useState<'items' | 'groups' | 'units'>('items');

    const tabs = [
        { id: 'items', label: 'Stock Items', icon: Package },
        { id: 'groups', label: 'Stock Groups', icon: Layers },
        { id: 'units', label: 'Units of Measure', icon: Scale },
    ] as const;

    if (!provider) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Initializing Inventory Arc...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Inventory Master</h1>
                <p className="text-muted-foreground font-medium">Manage stock items, groups, and units</p>
            </div>

            {!activeCompany ? (
                <div className="bg-card rounded-[2.5rem] border border-border p-20 text-center space-y-6 shadow-2xl">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                        <Building2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase">Service Required</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">Please select or establish a company to begin managing your inventory master records.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Tabs */}
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

                    {/* Content */}
                    <div className="min-h-[500px]">
                        {activeTab === 'items' && <StockItemList />}
                        {activeTab === 'groups' && <StockGroupList />}
                        {activeTab === 'units' && <UnitList />}
                    </div>
                </>)}
        </div>
    );
}
