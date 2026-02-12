import { useRef } from 'react';
import { Printer, X, FileText } from 'lucide-react';
import type { Voucher } from '../../../services/accounting/VoucherService';
import type { Company } from '../../../services/persistence/types';
import type { Ledger } from '../../../services/accounting/ReportService';
import { useLocalization } from '../../../hooks/useLocalization';
import { TaxService } from '../../../services/accounting/TaxService';

interface InvoiceModalProps {
    voucher: Voucher;
    company: Company;
    party: Ledger; // Renamed from customer to party to be generic
    onClose: () => void;
}

export default function InvoiceModal({ voucher, company, party, onClose }: InvoiceModalProps) {
    const { formatCurrency, tax } = useLocalization();
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    // Helper to determine Voucher Title
    const getVoucherTitle = (type: string) => {
        switch (type) {
            case 'Sales': return 'TAX INVOICE';
            case 'Purchase': return 'PURCHASE VOUCHER';
            case 'Payment': return 'PAYMENT VOUCHER';
            case 'Receipt': return 'RECEIPT VOUCHER';
            case 'Contra': return 'CONTRA VOUCHER';
            case 'Journal': return 'JOURNAL VOUCHER';
            default: return `${type.toUpperCase()} VOUCHER`;
        }
    };

    // Helper to determine Party Label (Bill To / Paid To / Received From)
    const getPartyLabel = (type: string) => {
        switch (type) {
            case 'Sales': return 'Bill To';
            case 'Purchase': return 'Supplier';
            case 'Payment': return 'Paid To';
            case 'Receipt': return 'Received From';
            default: return 'Party Details';
        }
    };

    const hasInventory = voucher.rows.some(r => r.inventoryAllocations && r.inventoryAllocations.length > 0);
    const summary = TaxService.calculateVoucherSummary(voucher);
    const { taxableValue, cgst, sgst, igst, cess, invoiceValue: totalAmount } = summary;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-card text-foreground w-full max-w-4xl h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col no-print-modal">
                {/* Modal Toolbar */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <FileText className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-black uppercase tracking-tight">{getVoucherTitle(voucher.type)} PREVIEW</h2>
                        <span className="px-3 py-1 bg-google-green/10 text-google-green text-[10px] font-black rounded-full uppercase">{voucher.voucherNo}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-muted rounded-xl transition-all"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div ref={printRef} className="p-12 print:p-8 flex-1 bg-card printable-area">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .printable-area, .printable-area * { visibility: visible; }
                            .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                            .no-print-modal { box-shadow: none !important; border: none !important; }
                        }
                    `}</style>
                    <div className="flex justify-between items-start border-b-2 border-foreground pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase text-foreground">{company.name}</h1>
                            <p className="text-sm font-bold text-muted-foreground mt-2 max-w-xs">{company.address}</p>
                            <div className="mt-4 inline-block px-3 py-1 bg-muted rounded-lg">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{tax.idLabel}: <span className="text-foreground">{company.gstin}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black text-muted/10 uppercase tracking-tighter mb-2 leading-none">{getVoucherTitle(voucher.type)}</h2>
                            <p className="text-sm font-black text-foreground mt-4 uppercase tracking-widest"># {voucher.voucherNo}</p>
                            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">Date: {new Date(voucher.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">{getPartyLabel(voucher.type)}</p>
                            <h3 className="text-xl font-black text-foreground uppercase">{party.name}</h3>
                            <p className="text-sm font-bold text-muted-foreground mt-2 whitespace-pre-line">{party.address || "Address not provided"}</p>
                            {party.gstin && <p className="text-xs font-black text-foreground mt-3 uppercase tracking-widest">{tax.idLabel}: {party.gstin}</p>}
                        </div>
                        {/* Only show 'Ship From' / Company details again if it's Sales/Purchase, otherwise maybe less relevant? 
                            Actually, standard format usually shows Company as header (done) and 'Receiver/Payer' details.
                            Let's keep the right side for Company Detail or empty for internal vouchers.
                         */}
                        <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                            {/* For simple vouchers we might not need the second box, but keeping layout consistent */}
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Voucher Details</p>
                                <p className="text-sm font-bold text-muted-foreground">Type: <span className="text-foreground">{voucher.type}</span></p>
                                {voucher.narration && <p className="text-sm font-medium text-muted-foreground mt-2">"{voucher.narration}"</p>}
                            </div>
                        </div>
                    </div>

                    {/* Content Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-foreground text-left">
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Particulars</th>
                                {hasInventory && <th className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Qty</th>}
                                {hasInventory && <th className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Rate</th>}
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {hasInventory ? (
                                // Inventory Item Rows
                                voucher.rows.map(r => r.inventoryAllocations).flat().filter(Boolean).map((item, idx: number) => (
                                    <tr key={idx}>
                                        <td className="py-6 font-black text-foreground uppercase">
                                            {/* We need Item Name here. If not in allocation, we have an issue. 
                                                VoucherService InventoryEntry has 'itemName'. Good. 
                                            */}
                                            {(item as any).itemName || `Item ${(item as any).itemId}`}
                                            <div className="text-[9px] text-muted-foreground font-bold mt-1">BATCH: {(item as any).batchNo || '-'} // EXP: {(item as any).expiryDate || '-'}</div>
                                        </td>
                                        <td className="py-6 text-right font-bold text-foreground">{(item as any).quantity}</td>
                                        <td className="py-6 text-right font-bold text-foreground">{formatCurrency((item as any).rate)}</td>
                                        <td className="py-6 text-right font-black text-foreground">{formatCurrency((item as any).amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                // Accounting Rows (Ledgers)
                                voucher.rows.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="py-6 font-black text-foreground uppercase">
                                            {row.account}
                                            <div className="text-[9px] text-muted-foreground font-bold mt-1 uppercase tracking-wider">{row.type === 'Dr' ? 'Debit' : 'Credit'}</div>
                                        </td>
                                        {/* Empty cells for Qty/Rate if generic table structure used, but we are conditionally rendering headers, so no need */}
                                        <td className="py-6 text-right font-black text-foreground">{formatCurrency(row.type === 'Dr' ? row.debit : row.credit)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-4">
                            {/* Only show Tax Breakdown if it's a Tax Invoice or has Tax */}
                            {(cgst > 0 || sgst > 0 || igst > 0 || cess > 0) && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-muted-foreground uppercase tracking-widest">{tax.labels.taxable}</span>
                                        <span className="font-black text-foreground">{formatCurrency(taxableValue)}</span>
                                    </div>
                                    {igst > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">IGST</span>
                                            <span className="font-black text-foreground">{formatCurrency(igst)}</span>
                                        </div>
                                    )}
                                    {cgst > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">CGST</span>
                                            <span className="font-black text-foreground">{formatCurrency(cgst)}</span>
                                        </div>
                                    )}
                                    {sgst > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">SGST</span>
                                            <span className="font-black text-foreground">{formatCurrency(sgst)}</span>
                                        </div>
                                    )}
                                    {cess > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">CESS</span>
                                            <span className="font-black text-foreground">{formatCurrency(cess)}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t-2 border-foreground">
                                <span className="text-sm font-black uppercase tracking-widest text-foreground">Total Amount</span>
                                <span className="text-2xl font-black text-foreground tracking-tighter">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Notes */}
                    <div className="mt-20 pt-8 border-t border-border flex justify-between items-end">
                        <div>
                            {(voucher.type === 'Sales' || voucher.type === 'Purchase') && (
                                <>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Terms & Conditions</p>
                                    <ul className="text-[9px] font-bold text-muted-foreground space-y-1">
                                        <li>1. Goods once sold will not be taken back.</li>
                                        <li>2. Payment should be made within 15 days.</li>
                                    </ul>
                                </>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="w-48 h-20 border-b border-foreground mb-2"></div>
                            <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Authorized Signatory</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
