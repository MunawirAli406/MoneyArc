import { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Calendar, ChevronDown, Keyboard, Package, Box, Tag, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { VoucherService, type Voucher, type VoucherRow, type InventoryEntry } from '../../../services/accounting/VoucherService';
import type { Ledger } from '../../../services/accounting/ReportService';
import type { StockItem, UnitOfMeasure } from '../../../services/inventory/types';
import { useNavigate, useParams } from 'react-router-dom';

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

    const tableRef = useRef<HTMLTableElement>(null);

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

        try {
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
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-6 pb-20"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 cyan-gradient rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3">
                        <Keyboard className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight uppercase leading-none">Universal Entry</h1>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                            <Box className="w-3 h-3" /> {activeCompany?.name} // {voucherType}
                        </p>
                    </div>
                </div>

                <div className="bg-card p-1.5 rounded-2xl border border-border shadow-inner flex flex-wrap gap-1">
                    {['Payment', 'Receipt', 'Journal', 'Contra', 'Sales', 'Purchase'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setVoucherType(type as VoucherType)}
                            className={clsx(
                                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                                voucherType === type
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                                    className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                                    placeholder="1.0000"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Entry Grid */}
                <div className="p-0 overflow-x-auto">
                    <table ref={tableRef} className="w-full border-collapse">
                        <thead>
                            <tr className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] bg-muted/30 border-b border-border">
                                <th className="py-5 px-10 w-28">Type</th>
                                <th className="py-5 px-4">Account Particulars</th>
                                <th className="py-5 px-4 w-44 text-right">Debit (₹)</th>
                                <th className="py-5 px-10 w-44 text-right">Credit (₹)</th>
                                <th className="py-5 px-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {rows.map((row) => (
                                <tr key={row.id} className="group transition-all hover:bg-muted/5">
                                    <td className="py-4 px-10">
                                        <select
                                            value={row.type}
                                            onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                                            className="w-full bg-transparent font-black text-sm text-primary outline-none cursor-pointer uppercase tracking-widest"
                                        >
                                            <option value="Dr">Dr</option>
                                            <option value="Cr">Cr</option>
                                        </select>
                                    </td>
                                    <td className="py-4 px-4 relative">
                                        <div className="flex flex-col gap-1">
                                            <div className="relative group/input">
                                                <input
                                                    list={`ledgers-${row.id}`}
                                                    value={row.account}
                                                    onChange={(e) => updateRow(row.id, 'account', e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-full outline-none border-b-2 border-transparent focus:border-primary transition-all font-bold text-base bg-transparent py-1.5 pr-8"
                                                    placeholder="Search ledger..."
                                                />
                                                <datalist id={`ledgers-${row.id}`}>
                                                    {ledgers.filter(l => {
                                                        if (voucherType === 'Contra') {
                                                            return l.group === 'Bank Accounts' || l.group === 'Cash-in-hand';
                                                        }
                                                        if (voucherType === 'Sales' && row.type === 'Cr') {
                                                            return l.group === 'Sales Accounts';
                                                        }
                                                        if (voucherType === 'Purchase' && row.type === 'Dr') {
                                                            return l.group === 'Purchase Accounts';
                                                        }
                                                        return true;
                                                    }).map(l => <option key={l.id} value={l.name} />)}
                                                </datalist>
                                                <ChevronDown className="w-4 h-4 text-muted-foreground/30 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within/input:text-primary" />
                                            </div>

                                            {/* Inventory Prompt if applicable */}
                                            {isInventoryMode && row.account && !['Cash', 'Bank'].some(k => row.account.includes(k)) && (
                                                <button
                                                    onClick={() => openInventoryAllocation(row.id)}
                                                    className={clsx(
                                                        "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-1 px-2 rounded-lg w-fit transition-all",
                                                        row.inventoryAllocations && row.inventoryAllocations.length > 0
                                                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                            : "bg-primary/5 text-primary hover:bg-primary/10"
                                                    )}
                                                >
                                                    <Package className="w-3.5 h-3.5" />
                                                    {row.inventoryAllocations && row.inventoryAllocations.length > 0
                                                        ? `${row.inventoryAllocations.length} Items Allocated`
                                                        : "Allocate Inventory"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <input
                                            type="number"
                                            value={row.debit || ''}
                                            onChange={(e) => updateRow(row.id, 'debit', parseFloat(e.target.value))}
                                            onKeyDown={handleKeyDown}
                                            disabled={row.type === 'Cr' || (isInventoryMode && !!row.inventoryAllocations?.length)}
                                            className={clsx(
                                                "w-full text-right outline-none bg-transparent transition-all font-mono font-black text-base px-2 py-1.5 rounded-xl block ml-auto",
                                                row.type === 'Dr' ? "text-foreground focus:bg-muted/30" : "opacity-0"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="py-4 px-10">
                                        <input
                                            type="number"
                                            value={row.credit || ''}
                                            onChange={(e) => updateRow(row.id, 'credit', parseFloat(e.target.value))}
                                            onKeyDown={handleKeyDown}
                                            disabled={row.type === 'Dr' || (isInventoryMode && !!row.inventoryAllocations?.length)}
                                            className={clsx(
                                                "w-full text-right outline-none bg-transparent transition-all font-mono font-black text-base px-2 py-1.5 rounded-xl block ml-auto",
                                                row.type === 'Cr' ? "text-foreground focus:bg-muted/30" : "opacity-0"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="py-4 px-4">
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="p-2 text-muted-foreground/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-muted/30">
                            <tr className="font-black text-foreground divide-x divide-border/20">
                                <td colSpan={2} className="py-6 px-10 flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Voucher Valuation Control</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={addRow}
                                            className="text-[10px] text-primary font-black uppercase tracking-widest hover:bg-primary/10 px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all border border-primary/20"
                                        >
                                            <Plus className="w-4 h-4" /> Add Line (Ctrl+N)
                                        </button>
                                    </div>
                                </td>
                                <td className="py-6 px-4 text-right font-mono text-xl text-primary border-t-4 border-primary/50 relative">
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-6 px-10 text-right font-mono text-xl text-primary border-t-4 border-primary/50 relative">
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
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
                            className="w-full px-6 py-4 bg-background border border-border rounded-[1.5rem] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none font-bold text-sm transition-all shadow-inner"
                            placeholder="Type full transaction ವಿವರ (description)..."
                        />
                    </div>
                    <div className="flex flex-col justify-end gap-6">
                        {Math.abs(totalDebit - totalCredit) > 0.01 && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-between text-rose-500 animate-pulse">
                                <span className="text-[10px] font-black uppercase tracking-widest">Difference</span>
                                <span className="font-mono font-bold">₹{Math.abs(totalDebit - totalCredit).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-2xl transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] flex items-center justify-center gap-4 py-4 bg-primary text-primary-foreground rounded-2xl hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98] shadow-xl shadow-primary/10"
                            >
                                <Save className="w-5 h-5" />
                                <span className="font-black uppercase tracking-[0.2em] text-[11px]">Finalize Entry</span>
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
    );
}
