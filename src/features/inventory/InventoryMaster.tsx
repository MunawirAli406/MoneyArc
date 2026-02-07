import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Layers, Scale } from 'lucide-react';
import StockItemList from './StockItemList';
import StockGroupList from './StockGroupList';
import UnitList from './UnitList';

export default function InventoryMaster() {
    const [activeTab, setActiveTab] = useState<'items' | 'groups' | 'units'>('items');

    const tabs = [
        { id: 'items', label: 'Stock Items', icon: Package },
        { id: 'groups', label: 'Stock Groups', icon: Layers },
        { id: 'units', label: 'Units of Measure', icon: Scale },
    ] as const;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Inventory Master</h1>
                <p className="text-muted-foreground font-medium">Manage stock items, groups, and units</p>
            </div>

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
        </div>
    );
}
