import { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Calendar, ChevronDown, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { VoucherService, type Voucher, type VoucherRow } from '../../../services/accounting/VoucherService';
import type { Ledger } from '../../../services/accounting/ReportService';
import { useNavigate } from 'react-router-dom';

type VoucherType = 'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'Sales' | 'Purchase';

export default function VoucherEntry() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [ledgers, setLedgers] = useState<Ledger[]>([]);

    const [voucherType, setVoucherType] = useState<VoucherType>('Payment');
    const [rows, setRows] = useState<VoucherRow[]>([
        { id: 1, type: 'Dr', account: '', debit: 0, credit: 0 },
        { id: 2, type: 'Cr', account: '', debit: 0, credit: 0 },
    ]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [narration, setNarration] = useState('');
    const [voucherNo, setVoucherNo] = useState('1');

    const tableRef = useRef<HTMLTableElement>(null);

    // Load Ledgers for dropdown
    useEffect(() => {
        const loadLedgers = async () => {
            if (provider && activeCompany) {
                const data = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];
                setLedgers(data);
            }
        };
        loadLedgers();
    }, [provider, activeCompany]);

    const handleKeyDown = (e: React.KeyboardEvent, _rowId: number, _field: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputs = Array.from(tableRef.current?.querySelectorAll('input, select') || []) as HTMLElement[];
            const currentIndex = inputs.indexOf(e.target as HTMLElement);
            if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            } else if (currentIndex === inputs.length - 1) {
                // Last input, maybe add row or focus save
                if (rows.length < 10) addRow();
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
        if (rows.length > 2) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const updateRow = (id: number, field: keyof VoucherRow, value: string | number) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                // Basic logic: if typing in particulars, you can add more advanced detection here if needed
                return updated;
            }
            return r;
        }));
    };

    const totalDebit = rows.reduce((acc, r) => acc + (Number(r.debit) || 0), 0);
    const totalCredit = rows.reduce((acc, r) => acc + (Number(r.credit) || 0), 0);

    const handleSave = async () => {
        if (!provider || !activeCompany) {
            alert("Please set up data storage and select a company first!");
            return;
        }
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert("Debit and Credit totals must match!");
            return;
        }

        try {
            const voucher: Voucher = {
                id: Date.now().toString(),
                voucherNo,
                date,
                type: voucherType,
                narration,
                rows
            };

            await VoucherService.saveVoucher(provider, voucher, activeCompany.path);
            alert("Voucher Saved!");
            navigate('/dashboard');

        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save voucher.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <Keyboard className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight uppercase leading-none">Voucher Entry</h1>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1.5">{activeCompany?.name} // {voucherType}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-muted p-1 rounded-xl flex gap-1">
                        {['Payment', 'Receipt', 'Journal', 'Contra', 'Sales', 'Purchase'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setVoucherType(type as VoucherType)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                                    voucherType === type
                                        ? 'bg-card text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-[2rem] shadow-xl border border-border overflow-hidden">
                {/* Compact Header */}
                <div className="px-8 py-6 border-b border-border bg-muted/20">
                    <div className="flex gap-8 items-end">
                        <div className="w-32">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Vch No</label>
                            <input
                                type="text"
                                value={voucherNo}
                                onChange={(e) => setVoucherNo(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 0, 'voucherNo')}
                                className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div className="w-48">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Effective Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 0, 'date')}
                                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                                <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Reference / Invoice #</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                </div>

                {/* Entry Grid - High Density */}
                <div className="p-0 overflow-x-auto">
                    <table ref={tableRef} className="w-full border-collapse">
                        <thead>
                            <tr className="text-left text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] bg-muted/30 border-b border-border">
                                <th className="py-3 px-8 w-24">Type</th>
                                <th className="py-3 px-4">Particulars</th>
                                <th className="py-3 px-4 w-40 text-right">Debit</th>
                                <th className="py-3 px-8 w-40 text-right">Credit</th>
                                <th className="py-3 px-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {rows.map((row) => (
                                <tr key={row.id} className="group transition-colors hover:bg-muted/10 border-b border-border/30">
                                    <td className="py-2 px-8">
                                        <select
                                            value={row.type}
                                            onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, row.id, 'type')}
                                            className="w-full bg-transparent font-black text-xs text-primary outline-none focus:ring-0 cursor-pointer uppercase tracking-widest"
                                        >
                                            <option value="Dr">Dr</option>
                                            <option value="Cr">Cr</option>
                                        </select>
                                    </td>
                                    <td className="py-2 px-4 relative">
                                        <input
                                            list={`ledgers-${row.id}`}
                                            value={row.account}
                                            onChange={(e) => updateRow(row.id, 'account', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, row.id, 'account')}
                                            className="w-full outline-none border-b border-transparent focus:border-primary transition-all font-bold text-sm bg-transparent placeholder-muted-foreground/20 py-1"
                                            placeholder="Select Ledger..."
                                        />
                                        <datalist id={`ledgers-${row.id}`}>
                                            {ledgers.map(l => (
                                                <option key={l.id} value={l.name} />
                                            ))}
                                        </datalist>
                                        <ChevronDown className="w-3 h-3 text-muted-foreground/20 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </td>
                                    <td className="py-2 px-4">
                                        <input
                                            type="number"
                                            value={row.debit || ''}
                                            onChange={(e) => updateRow(row.id, 'debit', parseFloat(e.target.value))}
                                            onKeyDown={(e) => handleKeyDown(e, row.id, 'debit')}
                                            disabled={row.type === 'Cr'}
                                            className={clsx(
                                                "w-full text-right outline-none bg-transparent transition-all font-mono font-bold text-sm",
                                                row.type === 'Dr' ? "text-foreground focus:text-primary" : "text-transparent"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="py-2 px-8">
                                        <input
                                            type="number"
                                            value={row.credit || ''}
                                            onChange={(e) => updateRow(row.id, 'credit', parseFloat(e.target.value))}
                                            onKeyDown={(e) => handleKeyDown(e, row.id, 'credit')}
                                            disabled={row.type === 'Dr'}
                                            className={clsx(
                                                "w-full text-right outline-none bg-transparent transition-all font-mono font-bold text-sm",
                                                row.type === 'Cr' ? "text-foreground focus:text-primary" : "text-transparent"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="py-2 px-4">
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="p-1 text-muted-foreground/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-muted/30 font-black text-foreground">
                                <td colSpan={2} className="py-4 px-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Voucher Balance</td>
                                <td className="py-4 px-4 text-right font-mono text-cyan-500 border-t-2 border-primary/20">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 px-8 text-right font-mono text-cyan-500 border-t-2 border-primary/20">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="p-4 flex justify-between bg-muted/10 border-t border-border/30">
                        <button
                            onClick={addRow}
                            className="text-[10px] text-primary font-black uppercase tracking-widest hover:bg-primary/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Add Row (Alt+A)
                        </button>
                        <div className="text-right">
                            {totalDebit !== totalCredit && (
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Difference: {(totalDebit - totalCredit).toFixed(2)}</p>
                            )}
                        </div>
                    </div>

                    <div className="px-8 pb-8 pt-4 space-y-2 bg-muted/10">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Narration Statement</label>
                        <textarea
                            value={narration}
                            onChange={(e) => setNarration(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 0, 'narration')}
                            rows={2}
                            className="w-full px-5 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none resize-none font-bold text-sm transition-all text-foreground"
                            placeholder="Being payment made towards..."
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-muted/30 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                        <span className="flex items-center gap-1"><kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">Enter</kbd> Next</span>
                        <span className="flex items-center gap-1"><kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">Alt+S</kbd> Save</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all">
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-2xl hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 shadow-xl shadow-primary/10"
                        >
                            <Save className="w-5 h-5" />
                            <span className="font-black uppercase tracking-[0.2em] text-[11px]">Authorize & Save</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
