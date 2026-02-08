import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Save, FileText, Calendar, Tag, AlertTriangle, Package, Keyboard, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { VoucherService, type Voucher, type VoucherRow, type InventoryEntry } from '../../../services/accounting/VoucherService';
import type { Ledger } from '../../../services/accounting/ReportService';
import type { StockItem, UnitOfMeasure } from '../../../services/inventory/types';
import { useNavigate, useParams } from 'react-router-dom';
import QuickLedgerForm from '../masters/QuickLedgerForm';
import QuickStockItemForm from '../masters/QuickStockItemForm';

type VoucherType = 'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'Sales' | 'Purchase';

export default function VoucherEntry() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const { id } = useParams();

    // Data States
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);

    // UI States
    const [voucherType, setVoucherType] = useState<VoucherType>('Payment');
    const isInventoryMode = voucherType === 'Sales' || voucherType === 'Purchase';
    const [rows, setRows] = useState<VoucherRow[]>([
        { id: 1, type: 'Dr', account: '', debit: 0, credit: 0 },
        { id: 2, type: 'Cr', account: '', debit: 0, credit: 0 },
    ]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [narration, setNarration] = useState('');
    const [voucherNo, setVoucherNo] = useState('1');
    const [currency, setCurrency] = useState('INR');
    const [exchangeRate, setExchangeRate] = useState(1);

    // Inventory Allocation State
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [activeRowId, setActiveRowId] = useState<number | null>(null);
    const [tempAllocations, setTempAllocations] = useState<InventoryEntry[]>([]);

    const [showQuickLedger, setShowQuickLedger] = useState(false);
    const [showQuickItem, setShowQuickItem] = useState(false);
    const [quickCreateInitial, setQuickCreateInitial] = useState('');

    const tableRef = useRef<HTMLTableElement>(null);

    const [submitting, setSubmitting] = useState(false);
    const [negativeAlerts, setNegativeAlerts] = useState<string[]>([]);
    const [taxSummary, setTaxSummary] = useState({ cgst: 0, sgst: 0, igst: 0 });

    // Initial Data Loading
    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                const [ledgerData, items, uoms, vouchers] = await Promise.all([
                    provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                    provider.read<StockItem[]>('stock_items.json', activeCompany.path),
                    provider.read<UnitOfMeasure[]>('units.json', activeCompany.path),
                    id ? provider.read<Voucher[]>('vouchers.json', activeCompany.path) : Promise.resolve(null)
                ]);

                setLedgers(ledgerData || []);
                setStockItems(items || []);
                setUnits(uoms || []);

                if (id && vouchers) {
                    const voucher = vouchers.find(v => v.id === id);
                    if (voucher) {
                        setVoucherType(voucher.type as VoucherType);
                        setVoucherNo(voucher.voucherNo);
                        setDate(voucher.date);
                        setNarration(voucher.narration);
                        setRows(voucher.rows);
                        setCurrency(voucher.currency || 'INR');
                        setExchangeRate(voucher.exchangeRate || 1);
                    }
                }
            }
        };
        loadData();
    }, [provider, activeCompany, id]);


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            // Determine context: Ledger or Item?
            // If Inventory Modal is open, it's Item. Else Ledger.
            if (showInventoryModal) {
                setShowQuickItem(true);
            } else {
                setShowQuickLedger(true);
                if (activeRowId !== null) {
                    const row = rows.find(r => r.id === activeRowId);
                    if (row) setQuickCreateInitial(row.account || '');
                } else {
                    // Try to find focused input value? Hard to get without ref.
                    setQuickCreateInitial('');
                }
            }
            return;
        }

        if (e.key === 'Enter') {
            const isSelect = (e.target as HTMLElement).tagName === 'SELECT';
            if (isSelect) return; // Let select handle enter for selection

            e.preventDefault();
            const inputs = Array.from(tableRef.current?.querySelectorAll('input, select') || []) as HTMLElement[];
            const currentIndex = inputs.indexOf(e.target as HTMLElement);
            if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            } else if (currentIndex === inputs.length - 1) {
                if (rows.length < 15) addRow();
            }
        }
    };

    // Real-time Insights Effect
    useEffect(() => {
        const analyzeVoucher = () => {
            const alerts: string[] = [];
            let cgst = 0, sgst = 0, igst = 0;

            rows.forEach(r => {
                if (!r.account) return;
                const ledger = ledgers.find(l => l.name === r.account);
                if (ledger) {
                    // Tax Calculation
                    if (ledger.name.includes('CGST')) cgst += (r.debit || r.credit);
                    if (ledger.name.includes('SGST')) sgst += (r.debit || r.credit);
                    if (ledger.name.includes('IGST')) igst += (r.debit || r.credit);

                    // Negative Balance Check
                    const currentBal = ledger.balance * (ledger.type === 'Dr' ? 1 : -1);
                    const localChange = (r.debit || 0) - (r.credit || 0);
                    const nextBal = currentBal + localChange;

                    if (['Cash-in-hand', 'Bank Accounts'].includes(ledger.group)) {
                        if (nextBal < 0) alerts.push(`${ledger.name} balance will drop to ₹${Math.abs(nextBal).toLocaleString()} Cr`);
                    }
                }
            });

            setNegativeAlerts(alerts);
            setTaxSummary({ cgst, sgst, igst });
        };

        analyzeVoucher();
    }, [rows, ledgers]);

    const addRow = () => {
        const lastRow = rows[rows.length - 1];
        setRows([...rows, {
            id: Date.now(),
            type: lastRow.type === 'Dr' ? 'Cr' : 'Dr',
            account: '',
            debit: 0,
            credit: 0
        }]);
    };

    const removeRow = (id: number) => {
        if (rows.length > 2) setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: number, field: keyof VoucherRow, value: string | number | unknown) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const totalDebit = rows.reduce((acc, r) => acc + (Number(r.debit) || 0), 0);
    const totalCredit = rows.reduce((acc, r) => acc + (Number(r.credit) || 0), 0);

    // Inventory Allocation Logic
    const openInventoryAllocation = (rowId: number) => {
        const row = rows.find(r => r.id === rowId);
        if (row) {
            setActiveRowId(rowId);
            setTempAllocations(row.inventoryAllocations || []);
            setShowInventoryModal(true);
        }
    };

    const addInventoryRow = () => {
        setTempAllocations([...tempAllocations, {
            id: Date.now().toString(),
            itemId: '',
            itemName: '',
            quantity: 0,
            unitId: '',
            rate: 0,
            amount: 0
        }]);
    };

    const updateInventoryRow = (id: string, field: keyof InventoryEntry, value: string | number | unknown) => {
        setTempAllocations(tempAllocations.map(a => {
            if (a.id === id) {
                const updated = { ...a, [field]: value };
                if (field === 'itemId') {
                    const item = stockItems.find(i => i.id === value);
                    if (item) {
                        updated.itemName = item.name;
                        updated.unitId = item.unitId;
                        updated.rate = item.currentRate || item.openingRate;
                    }
                }
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
                }
                return updated;
            }
            return a;
        }));
    };

    const saveAllocation = () => {
        if (activeRowId !== null) {
            const totalAllocAmount = tempAllocations.reduce((sum, a) => sum + a.amount, 0);

            // Determine Tax Type (Intra-state vs Inter-state)
            const activeRow = rows.find(r => r.id === activeRowId);
            const counterpartyLedger = rows.find(r => r.id !== activeRowId && r.account !== '' && !['GST', 'Tax', 'Output', 'Input'].some(k => r.account.includes(k))) ||
                rows.find(r => r.id !== activeRowId && r.account !== '');
            const counterparty = ledgers.find(l => l.name === counterpartyLedger?.account);

            const isInterState = activeCompany?.state && counterparty?.state &&
                activeCompany.state.trim().toLowerCase() !== counterparty.state.trim().toLowerCase();

            // Calculate GST impact
            let totalGst = 0;
            tempAllocations.forEach(a => {
                const item = stockItems.find(i => i.id === a.itemId);
                if (item && item.gstRate) {
                    totalGst += (a.amount * item.gstRate) / 100;
                }
            });

            const newRows = [...rows];
            const rowIndex = newRows.findIndex(r => r.id === activeRowId);

            if (rowIndex !== -1) {
                newRows[rowIndex] = {
                    ...newRows[rowIndex],
                    inventoryAllocations: tempAllocations,
                    debit: newRows[rowIndex].type === 'Dr' ? totalAllocAmount : 0,
                    credit: newRows[rowIndex].type === 'Cr' ? totalAllocAmount : 0
                };

                // Define tax ledgers
                const taxLedgerNames = ['Central GST (CGST)', 'State GST (SGST)', 'Integrated GST (IGST)', 'Output GST'];

                // Clear previous auto-added tax rows to avoid duplicates
                const finalRows = newRows.filter(r => !taxLedgerNames.includes(r.account));

                if (totalGst > 0) {
                    const commonType = activeRow?.type || 'Dr';

                    if (isInterState) {
                        finalRows.push({
                            id: Date.now() + 10,
                            type: commonType,
                            account: 'Integrated GST (IGST)',
                            debit: commonType === 'Dr' ? totalGst : 0,
                            credit: commonType === 'Cr' ? totalGst : 0
                        });
                    } else {
                        finalRows.push({
                            id: Date.now() + 11,
                            type: commonType,
                            account: 'Central GST (CGST)',
                            debit: commonType === 'Dr' ? totalGst / 2 : 0,
                            credit: commonType === 'Cr' ? totalGst / 2 : 0
                        }, {
                            id: Date.now() + 12,
                            type: commonType,
                            account: 'State GST (SGST)',
                            debit: commonType === 'Dr' ? totalGst / 2 : 0,
                            credit: commonType === 'Cr' ? totalGst / 2 : 0
                        });
                    }
                }

                // Find the "other" row (typically Party, Cash, or Bank) to balance the voucher
                const mainRowIndex = finalRows.findIndex(r =>
                    r.id !== activeRowId &&
                    !taxLedgerNames.includes(r.account) &&
                    r.account !== ''
                );

                if (mainRowIndex !== -1) {
                    const totalVoucherAmount = totalAllocAmount + totalGst;
                    const otherRow = finalRows[mainRowIndex];
                    finalRows[mainRowIndex] = {
                        ...otherRow,
                        debit: otherRow.type === 'Dr' ? totalVoucherAmount : 0,
                        credit: otherRow.type === 'Cr' ? totalVoucherAmount : 0
                    };
                }

                setRows(finalRows);
            }

            setShowInventoryModal(false);
            setActiveRowId(null);
        }
    };

    const handleSave = async () => {
        if (!provider || !activeCompany) return;
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert("Debit and Credit totals must match!");
            return;
        }

        setSubmitting(true);
        try {
            // Simulate a small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 600));

            const voucher: Voucher = {
                id: id || Date.now().toString(),
                voucherNo,
                date,
                type: voucherType,
                narration,
                rows,
                currency,
                exchangeRate
            };

            if (id) {
                await VoucherService.updateVoucher(provider, voucher, activeCompany.path);
            } else {
                await VoucherService.saveVoucher(provider, voucher, activeCompany.path);
            }

            navigate('/reports/daybook');
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save voucher.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto space-y-6 pb-20"
            >
                {/* Header Section */}
                {/* ... (rest of the file remains, I need to match the StartLine) */}
                {/* Actually, replacing the whole block is risky if I don't paste everything. */}
                {/* I will use multi_replace to target top and bottom separately. */}
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 cyan-gradient rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30">
                            <Keyboard className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Universal Entry</h1>
                            <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2 opacity-70">
                                <Box className="w-3.5 h-3.5" /> {activeCompany?.name} <span className="text-primary font-black">//</span> {voucherType}
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel p-2 rounded-2xl flex items-center gap-1">
                        {['Payment', 'Receipt', 'Journal', 'Contra', 'Sales', 'Purchase'].map(type => (
                            <button
                                key={type}
                                onClick={() => setVoucherType(type as VoucherType)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    voucherType === type
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-hidden">
                    {/* Meta Data Bar */}
                    <div className="px-10 py-8 border-b border-border bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Vch Number</label>
                                <input
                                    type="text"
                                    value={voucherNo}
                                    onChange={(e) => setVoucherNo(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Effective Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-12 pr-5 py-3.5 bg-background border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                                    />
                                    <Calendar className="w-5 h-5 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Reference / External Doc #</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-5 py-3.5 bg-background border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                                        placeholder="Order ID / Invoice reference..."
                                    />
                                    <Tag className="w-5 h-5 text-muted-foreground/50 absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Currency</label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm appearance-none"
                                    >
                                        <option value="INR">INR</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Ex. Rate</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                                        className="input-premium w-full"
                                        placeholder="1.0000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Entry Grid */}
                    <div className="p-0 overflow-x-auto min-h-[400px]">
                        <table ref={tableRef} className="w-full border-collapse">
                            <thead>
                                <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
                                    <th className="py-1 px-2 w-20">Type</th>
                                    <th className="py-1 px-2">Particulars</th>
                                    <th className="py-1 px-2 w-32 text-right">Debit</th>
                                    <th className="py-1 px-2 w-32 text-right">Credit</th>
                                    <th className="py-1 px-1 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {rows.map((row) => (
                                    <tr key={row.id} className="group hover:bg-muted/10 transition-colors relative">
                                        <td className="py-0.5 px-2 align-top">
                                            <select
                                                value={row.type}
                                                onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                                                className="w-full bg-transparent font-bold text-sm text-primary outline-none cursor-pointer uppercase py-1"
                                            >
                                                <option value="Dr">Dr</option>
                                                <option value="Cr">Cr</option>
                                            </select>
                                        </td>
                                        <td className="py-0.5 px-2 relative align-top">
                                            <div className="flex flex-col gap-1">
                                                <div className="relative group/input">
                                                    <input
                                                        type="text"
                                                        value={row.account}
                                                        onChange={(e) => {
                                                            updateRow(row.id, 'account', e.target.value);
                                                            setActiveRowId(row.id); // Open dropdown on type
                                                        }}
                                                        onFocus={() => setActiveRowId(row.id)}
                                                        onBlur={() => setTimeout(() => {
                                                            if (activeRowId === row.id) setActiveRowId(null)
                                                        }, 200)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'ArrowDown') {
                                                                // Logic to navigate custom dropdown could go here
                                                            }
                                                            handleKeyDown(e);
                                                        }}
                                                        className="w-full outline-none border-b border-transparent focus:border-primary font-semibold text-sm bg-transparent py-1 pr-8"
                                                        placeholder="Select Ledger..."
                                                    />
                                                    {/* Custom Dropdown for Balance Display */}
                                                    {activeRowId === row.id && (
                                                        <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[300px] max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-xl py-1">
                                                            <div
                                                                className="px-3 py-2 hover:bg-primary/10 cursor-pointer flex items-center gap-2 text-primary font-bold border-b border-border/50"
                                                                onMouseDown={() => {
                                                                    setQuickCreateInitial(row.account || '');
                                                                    setShowQuickLedger(true);
                                                                    setActiveRowId(null);
                                                                }}
                                                            >
                                                                <Plus className="w-3 h-3" /> Create New Ledger (Alt+C)
                                                            </div>
                                                            {ledgers
                                                                .filter(l => {
                                                                    const search = row.account.toLowerCase();
                                                                    if (!l.name.toLowerCase().includes(search)) return false;
                                                                    if (voucherType === 'Contra') return l.group === 'Bank Accounts' || l.group === 'Cash-in-hand';
                                                                    if (rows.length === 2 && row.id === rows[0].id && voucherType === 'Payment') return l.group === 'Bank Accounts' || l.group === 'Cash-in-hand'; // First row in payment is Source (Bank/Cash) usually? Tally logic is debatable. Let's keep general.
                                                                    // Actually Tally allows anything anywhere often, but filters types.
                                                                    // Let's keep logic simple for now.
                                                                    if (voucherType === 'Sales' && row.type === 'Cr') return l.group === 'Sales Accounts' || l.group === 'Direct Incomes';
                                                                    if (voucherType === 'Purchase' && row.type === 'Dr') return l.group === 'Purchase Accounts' || l.group === 'Direct Expenses';
                                                                    return true;
                                                                })
                                                                .map(l => (
                                                                    <div
                                                                        key={l.id}
                                                                        onMouseDown={() => {
                                                                            updateRow(row.id, 'account', l.name);
                                                                            setActiveRowId(null);
                                                                        }}
                                                                        className="px-3 py-2 hover:bg-primary/10 cursor-pointer flex justify-between items-center text-xs group/item"
                                                                    >
                                                                        <span className="font-semibold text-foreground">{l.name}</span>
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-[10px] text-muted-foreground group-hover/item:text-foreground">{l.group}</span>
                                                                            <span className="font-mono text-muted-foreground font-bold">
                                                                                {l.balance.toLocaleString()} {l.type}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }
                                                            {ledgers.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No ledgers found</div>}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Inventory Prompt */}
                                                {isInventoryMode && row.account && !['Cash', 'Bank'].some(k => row.account.includes(k)) && (
                                                    <button
                                                        onClick={() => openInventoryAllocation(row.id)}
                                                        className={clsx(
                                                            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded w-fit transition-all mb-1",
                                                            row.inventoryAllocations && row.inventoryAllocations.length > 0
                                                                ? "bg-emerald-500/10 text-emerald-600"
                                                                : "bg-primary/5 text-primary"
                                                        )}
                                                    >
                                                        <Package className="w-3 h-3" />
                                                        {row.inventoryAllocations && row.inventoryAllocations.length > 0
                                                            ? `${row.inventoryAllocations.length} Items`
                                                            : "Item Alloc"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-0.5 px-2 align-top">
                                            <input
                                                type="number"
                                                value={row.debit || ''}
                                                onChange={(e) => updateRow(row.id, 'debit', parseFloat(e.target.value))}
                                                onKeyDown={handleKeyDown}
                                                disabled={row.type === 'Cr' || (isInventoryMode && !!row.inventoryAllocations?.length)}
                                                className={clsx(
                                                    "w-full text-right outline-none bg-transparent font-mono font-medium text-sm px-2 py-1 border-b border-transparent focus:border-primary transition-all",
                                                    row.type === 'Dr' ? "text-foreground" : "opacity-0"
                                                )}
                                                placeholder=""
                                            />
                                        </td>
                                        <td className="py-0.5 px-2 align-top">
                                            <input
                                                type="number"
                                                value={row.credit || ''}
                                                onChange={(e) => updateRow(row.id, 'credit', parseFloat(e.target.value))}
                                                onKeyDown={handleKeyDown}
                                                disabled={row.type === 'Dr' || (isInventoryMode && !!row.inventoryAllocations?.length)}
                                                className={clsx(
                                                    "w-full text-right outline-none bg-transparent font-mono font-medium text-sm px-2 py-1 border-b border-transparent focus:border-primary transition-all",
                                                    row.type === 'Cr' ? "text-foreground" : "opacity-0"
                                                )}
                                                placeholder=""
                                            />
                                        </td>
                                        <td className="py-1 px-2 align-top text-center">
                                            <button
                                                onClick={() => removeRow(row.id)}
                                                tabIndex={-1}
                                                className="p-1 text-muted-foreground/20 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/20 font-bold text-sm">
                                <tr>
                                    <td colSpan={5} className="py-2 px-4 shadow-inner">
                                        <button
                                            onClick={addRow}
                                            className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg w-full justify-center"
                                        >
                                            <Plus className="w-4 h-4" /> Add Row
                                        </button>
                                    </td>
                                </tr>
                                <tr className="border-t border-border">
                                    <td colSpan={2} className="py-2 px-4 text-right pr-10 uppercase text-muted-foreground text-[10px] tracking-widest pt-3">
                                        Total
                                    </td>
                                    <td className="py-2 px-4 text-right font-mono text-foreground pt-3 border-t-2 border-foreground/10">
                                        {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-4 text-right font-mono text-foreground pt-3 border-t-2 border-foreground/10">
                                        {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer Section */}
                    <div className="px-10 py-10 bg-muted/10 border-t border-border grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-4">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Detailed Narration Statement
                            </label>
                            <textarea
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                rows={3}
                                className="input-premium w-full resize-none min-h-[100px]"
                                placeholder="Type full transaction ವಿವರ (description)..."
                            />
                        </div>
                        <div className="flex flex-col justify-end gap-6">
                            {negativeAlerts.length > 0 && (
                                <div className="space-y-2">
                                    {negativeAlerts.map((alert, i) => (
                                        <motion.div
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            key={i}
                                            className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3 text-amber-600"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-tight">{alert}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Tax Breakdown */}
                            {(taxSummary.cgst > 0 || taxSummary.sgst > 0 || taxSummary.igst > 0) && (
                                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl space-y-2">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Tax Estimate</p>
                                    {taxSummary.cgst > 0 && <div className="flex justify-between text-[10px] font-bold"><span>CGST Total</span><span>₹{taxSummary.cgst.toLocaleString()}</span></div>}
                                    {taxSummary.sgst > 0 && <div className="flex justify-between text-[10px] font-bold"><span>SGST Total</span><span>₹{taxSummary.sgst.toLocaleString()}</span></div>}
                                    {taxSummary.igst > 0 && <div className="flex justify-between text-[10px] font-bold"><span>IGST Total</span><span>₹{taxSummary.igst.toLocaleString()}</span></div>}
                                </div>
                            )}

                            {Math.abs(totalDebit - totalCredit) > 0.01 && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-between text-rose-500 animate-pulse">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Difference</span>
                                    <span className="font-mono font-bold">₹{Math.abs(totalDebit - totalCredit).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="btn-premium flex-1 border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={submitting}
                                    className="btn-premium flex-[2] flex items-center justify-center gap-4 bg-primary text-primary-foreground"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    <span>{submitting ? 'Saving...' : 'Finalize Entry'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Allocation Modal */}
                <AnimatePresence>
                    {showInventoryModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-card w-full max-w-5xl rounded-[3rem] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="px-10 py-8 border-b border-border bg-muted/20 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 rotate-3">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Inventory Allocations</h2>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{rows.find(r => r.id === activeRowId)?.account}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={addInventoryRow}
                                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                        >
                                            <Plus className="w-4 h-4" /> Add Item
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-0">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="text-left text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] bg-muted/10 border-b border-border">
                                                <th className="py-4 px-10">Stock Item</th>
                                                <th className="py-4 px-4 w-40">Batch No / Expiry</th>
                                                <th className="py-4 px-4 w-32 text-right">Quantity</th>
                                                <th className="py-4 px-4 w-36 text-right">Rate / Unit</th>
                                                <th className="py-4 px-10 w-44 text-right">Value (₹)</th>
                                                <th className="py-4 px-4 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {tempAllocations.map((alloc) => (
                                                <tr key={alloc.id} className="hover:bg-muted/5 transition-all">
                                                    <td className="py-4 px-10">
                                                        <select
                                                            value={alloc.itemId}
                                                            onChange={(e) => updateInventoryRow(alloc.id, 'itemId', e.target.value)}
                                                            className="w-full bg-transparent font-bold text-sm outline-none focus:text-primary transition-all appearance-none"
                                                        >
                                                            <option value="">Select Stock Item...</option>
                                                            {stockItems.map(item => (
                                                                <option key={item.id} value={item.id}>{item.name} ({units.find(u => u.id === item.unitId)?.name})</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="py-4 px-4 space-y-1">
                                                        <input
                                                            type="text"
                                                            value={alloc.batchNo || ''}
                                                            onChange={(e) => updateInventoryRow(alloc.id, 'batchNo', e.target.value)}
                                                            className="w-full bg-background border border-border rounded-lg px-2 py-1 text-[10px] uppercase font-black"
                                                            placeholder="BATCH #"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={alloc.expiryDate || ''}
                                                            onChange={(e) => updateInventoryRow(alloc.id, 'expiryDate', e.target.value)}
                                                            className="w-full bg-background border border-border rounded-lg px-2 py-1 text-[10px] font-bold"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <input
                                                            type="number"
                                                            value={alloc.quantity || ''}
                                                            onChange={(e) => updateInventoryRow(alloc.id, 'quantity', parseFloat(e.target.value))}
                                                            className="w-full text-right bg-transparent outline-none font-mono font-bold text-sm focus:text-emerald-500"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <input
                                                            type="number"
                                                            value={alloc.rate || ''}
                                                            onChange={(e) => updateInventoryRow(alloc.id, 'rate', parseFloat(e.target.value))}
                                                            className="w-full text-right bg-transparent outline-none font-mono font-bold text-sm focus:text-emerald-500"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-10 text-right font-mono font-black text-sm text-emerald-600">
                                                        ₹{alloc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <button
                                                            onClick={() => setTempAllocations(tempAllocations.filter(a => a.id !== alloc.id))}
                                                            className="p-1.5 text-rose-500/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {tempAllocations.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                                            <Package className="w-12 h-12 opacity-10" />
                                                            <p className="text-xs font-black uppercase tracking-[0.3em]">No items allocated yet</p>
                                                            <button
                                                                onClick={addInventoryRow}
                                                                className="text-[10px] text-emerald-500 font-black uppercase tracking-widest hover:underline"
                                                            >
                                                                Add first item
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-10 py-8 bg-muted/20 border-t border-border flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Quantity</p>
                                            <p className="text-xl font-black font-mono">{tempAllocations.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0)} Units</p>
                                        </div>
                                        <div className="w-px h-10 bg-border" />
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Valuation</p>
                                            <p className="text-2xl font-black font-mono text-emerald-600">₹{tempAllocations.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setShowInventoryModal(false)}
                                            className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveAllocation}
                                            className="px-12 py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-95"
                                        >
                                            Confirm Allocation
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>

            {
                showQuickLedger && (
                    <QuickLedgerForm
                        onClose={() => setShowQuickLedger(false)}
                        initialName={quickCreateInitial}
                        onSuccess={(newName) => {
                            // Refresh ledgers
                            if (provider && activeCompany) {
                                provider.read<Ledger[]>('ledgers.json', activeCompany.path).then(data => setLedgers(data || []));
                            }
                            // If opened from a row, update that row
                            if (activeRowId !== null) {
                                updateRow(activeRowId, 'account', newName);
                            }
                        }}
                    />
                )
            }

            {
                showQuickItem && (
                    <QuickStockItemForm
                        onClose={() => setShowQuickItem(false)}
                        initialName=""
                        onSuccess={(itemName, itemId) => {
                            // Refresh items
                            if (provider && activeCompany) {
                                provider.read<StockItem[]>('stock_items.json', activeCompany.path).then(data => setStockItems(data || []));
                            }
                            console.log('Item created:', itemName, itemId);
                        }}
                    />
                )
            }
        </>
    );
}
