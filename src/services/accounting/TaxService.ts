import type { Voucher } from './VoucherService';
import type { Ledger } from './ReportService';
import type { StockItem } from '../inventory/types';

export interface TaxVoucherSummary {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalTax: number;
    invoiceValue: number;
    category: 'B2B' | 'B2CL' | 'B2CS' | 'CDNR' | 'CDNUR' | 'EXP' | 'NIL' | 'NON_GST' | 'DOCS' | 'HSN';
    hsnData?: Record<string, { hsnCode: string; description: string; taxable: number; tax: number; qty: number; uom: string }>;
}

export interface Gstr1Summary {
    b2b: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    b2cl: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    b2cs: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    cdnr: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    cdnur: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    exp: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    nil: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    advances: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    adjustments: { vouchers: Voucher[]; taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    hsn: Record<string, { hsnCode: string; description: string; taxable: number; tax: number; qty: number; uom: string }>;
    docs: {
        invoices: { from: string; to: string; count: number; cancelled: number };
        creditNotes: { from: string; to: string; count: number; cancelled: number };
        debitNotes: { from: string; to: string; count: number; cancelled: number };
    };
    counts: {
        total: number;
        included: number;
        notRelevant: number;
        uncertain: number;
    };
    consolidated: { taxable: number; cgst: number; sgst: number; igst: number; cess: number; tax: number; total: number };
    b2csRateWise: Record<string, { pos: string; rate: number; taxable: number; igst: number; cgst: number; sgst: number; cess: number; count: number }>;
}

export class TaxService {
    /**
     * Identifies if an account is a tax ledger based on common naming patterns.
     */
    static isTaxLedger(accountName: string): boolean {
        const acc = accountName.toLowerCase();
        return acc.includes('gst') || acc.includes('tax') || acc.includes('duty') || acc.includes('cess') || acc.includes('vat');
    }

    /**
     * Calculates tax summary for a single voucher, including Tally-style section categorization.
     */
    static calculateVoucherSummary(voucher: Voucher, ledgers: Ledger[] = [], stockItems: StockItem[] = []): TaxVoucherSummary {
        let taxableValue = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        let cess = 0;
        let totalTax = 0;
        let invoiceValue = 0;
        const hsnData: Record<string, { hsnCode: string; description: string; taxable: number; tax: number; qty: number; uom: string }> = {};

        const isSales = voucher.type === 'Sales';
        const isPurchase = voucher.type === 'Purchase';
        const isCreditNote = voucher.type === 'Credit Note';
        const isDebitNote = voucher.type === 'Debit Note';

        const cgstTags = ['cgst', 'central'];
        const sgstTags = ['sgst', 'state'];
        const igstTags = ['igst', 'integrated'];
        const cessTags = ['cess'];

        // Determine Category
        let category: TaxVoucherSummary['category'] = 'B2CS';
        const partyRow = voucher.rows.find(r => {
            const l = ledgers.find(led => led.name === r.account);
            return l?.group === 'Sundry Debtors' || l?.group === 'Sundry Creditors';
        });

        if (partyRow) {
            const party = ledgers.find(led => led.name === partyRow.account);
            if (party) {
                const totalAmt = voucher.rows.reduce((s, r) => s + (r.debit || r.credit || 0), 0) / 2;
                const isInterstate = party.state !== 'Home State'; // Simplified logic

                if (isCreditNote || isDebitNote) {
                    category = party.gstin ? 'CDNR' : 'CDNUR';
                } else if (party.gstin) {
                    category = 'B2B';
                } else if (party.registrationType === 'Consumer' || party.registrationType === 'Unregistered') {
                    category = (isInterstate && totalAmt > 250000) ? 'B2CL' : 'B2CS';
                }
            }
        }

        voucher.rows.forEach(r => {
            const accName = r.account.toLowerCase();
            const isTax = this.isTaxLedger(r.account);
            const amount = r.debit || r.credit || 0;

            if (isSales || isCreditNote) {
                const positiveType = isSales ? 'Cr' : 'Dr';
                const negativeType = isSales ? 'Dr' : 'Cr';

                if (r.type === positiveType) {
                    if (isTax) {
                        if (cgstTags.some(tag => accName.includes(tag))) cgst += amount;
                        else if (sgstTags.some(tag => accName.includes(tag))) sgst += amount;
                        else if (igstTags.some(tag => accName.includes(tag))) igst += amount;
                        else if (cessTags.some(tag => accName.includes(tag))) cess += amount;
                        else cgst += amount;
                        totalTax += amount;
                    } else {
                        const ledger = ledgers.find(l => l.name === r.account);
                        const isTaxableGroup = ledger && ['Sales Accounts', 'Purchase Accounts'].includes(ledger.group);

                        if (isTaxableGroup) {
                            taxableValue += amount;
                            if (r.inventoryAllocations) {
                                r.inventoryAllocations.forEach(alloc => {
                                    const stockItem = stockItems.find(si => si.name === alloc.itemName);
                                    const hsn = stockItem?.hsnCode || 'GENERAL';

                                    if (!hsnData[hsn]) {
                                        hsnData[hsn] = {
                                            hsnCode: hsn,
                                            description: alloc.itemName,
                                            taxable: 0,
                                            tax: 0,
                                            qty: 0,
                                            uom: stockItem?.unitId || 'PCS'
                                        };
                                    }
                                    hsnData[hsn].taxable += alloc.amount;
                                    hsnData[hsn].qty += alloc.quantity;

                                    if (taxableValue > 0) {
                                        hsnData[hsn].tax += (alloc.amount / taxableValue) * totalTax;
                                    }
                                });
                            }
                        }
                    }
                } else if (r.type === negativeType) {
                    if (!isTax) invoiceValue += amount;
                }
            } else if (isPurchase || isDebitNote) {
                const positiveType = isPurchase ? 'Dr' : 'Cr';
                const negativeType = isPurchase ? 'Cr' : 'Dr';

                if (r.type === positiveType) {
                    if (isTax) {
                        if (cgstTags.some(tag => accName.includes(tag))) cgst += amount;
                        else if (sgstTags.some(tag => accName.includes(tag))) sgst += amount;
                        else if (igstTags.some(tag => accName.includes(tag))) igst += amount;
                        else if (cessTags.some(tag => accName.includes(tag))) cess += amount;
                        else cgst += amount;
                        totalTax += amount;
                    } else {
                        const ledger = ledgers.find(l => l.name === r.account);
                        const isTaxableGroup = ledger && ['Sales Accounts', 'Purchase Accounts'].includes(ledger.group);
                        if (isTaxableGroup) {
                            taxableValue += amount;
                        }
                    }
                } else if (r.type === negativeType) {
                    if (!isTax) invoiceValue += amount;
                }
            }
        });

        return { taxableValue, cgst, sgst, igst, cess, totalTax, invoiceValue, category, hsnData };
    }

    static aggregateGstr1Data(vouchers: Voucher[], ledgers: Ledger[] = [], stockItems: StockItem[] = []): Gstr1Summary {
        const summary: Gstr1Summary = {
            b2b: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            b2cl: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            b2cs: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            cdnr: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            cdnur: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            exp: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            nil: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            advances: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            adjustments: { vouchers: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            hsn: {},
            docs: {
                invoices: { from: '', to: '', count: 0, cancelled: 0 },
                creditNotes: { from: '', to: '', count: 0, cancelled: 0 },
                debitNotes: { from: '', to: '', count: 0, cancelled: 0 }
            },
            counts: {
                total: vouchers.length,
                included: 0,
                notRelevant: 0,
                uncertain: 0
            },
            consolidated: { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, tax: 0, total: 0 },
            b2csRateWise: {}
        };

        const sortedVouchers = [...vouchers].sort((a, b) => a.voucherNo.localeCompare(b.voucherNo, undefined, { numeric: true }));

        sortedVouchers.forEach(v => {
            const vSummary = this.calculateVoucherSummary(v, ledgers, stockItems);

            const isRelevant = ['Sales', 'Purchase', 'Credit Note', 'Debit Note'].includes(v.type);
            if (!isRelevant) {
                summary.counts.notRelevant++;
                return;
            }

            summary.counts.included++;

            let target: Gstr1Summary['b2b'] | null = null;
            if (vSummary.category === 'B2B') target = summary.b2b;
            else if (vSummary.category === 'B2CL') target = summary.b2cl;
            else if (vSummary.category === 'B2CS') target = summary.b2cs;
            else if (vSummary.category === 'CDNR') target = summary.cdnr;
            else if (vSummary.category === 'CDNUR') target = summary.cdnur;
            else if (vSummary.category === 'EXP') target = summary.exp;
            else if (vSummary.category === 'NIL') target = summary.nil;

            if (target) {
                target.vouchers.push(v);
                target.taxable += vSummary.taxableValue;
                target.cgst += vSummary.cgst;
                target.sgst += vSummary.sgst;
                target.igst += vSummary.igst;
                target.cess += vSummary.cess;
                target.tax += vSummary.totalTax;
                target.total += vSummary.invoiceValue;

                if (vSummary.category === 'B2CS') {
                    const partyRow = v.rows.find(r => {
                        const l = ledgers.find(led => led.name === r.account);
                        return l?.group === 'Sundry Debtors' || l?.group === 'Sundry Creditors';
                    });
                    const party = ledgers.find(l => l.name === partyRow?.account);
                    const pos = party?.state || 'Home State';

                    let processedTaxableValue = 0;
                    v.rows.forEach(r => {
                        if (r.inventoryAllocations) {
                            r.inventoryAllocations.forEach(alloc => {
                                const stockItem = stockItems.find(si => si.name === alloc.itemName);
                                const rate = stockItem?.gstRate || 0;
                                const key = `${pos}_${rate}`;

                                if (!summary.b2csRateWise[key]) {
                                    summary.b2csRateWise[key] = { pos, rate, taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, count: 0 };
                                }

                                const ratio = alloc.amount / (vSummary.taxableValue || 1);
                                summary.b2csRateWise[key].taxable += alloc.amount;
                                summary.b2csRateWise[key].igst += vSummary.igst * ratio;
                                summary.b2csRateWise[key].cgst += vSummary.cgst * ratio;
                                summary.b2csRateWise[key].sgst += vSummary.sgst * ratio;
                                summary.b2csRateWise[key].cess += vSummary.cess * ratio;
                                processedTaxableValue += alloc.amount;
                            });
                        }
                    });

                    if (processedTaxableValue < vSummary.taxableValue - 0.01) {
                        const remainingTaxable = vSummary.taxableValue - processedTaxableValue;
                        const effectiveRate = vSummary.taxableValue > 0 ? (vSummary.totalTax / vSummary.taxableValue) : 0;
                        const rate = Math.round(effectiveRate * 100);
                        const key = `${pos}_${rate}`;

                        if (!summary.b2csRateWise[key]) {
                            summary.b2csRateWise[key] = { pos, rate, taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, count: 0 };
                        }

                        const ratio = remainingTaxable / (vSummary.taxableValue || 1);
                        summary.b2csRateWise[key].taxable += remainingTaxable;
                        summary.b2csRateWise[key].igst += vSummary.igst * ratio;
                        summary.b2csRateWise[key].cgst += vSummary.cgst * ratio;
                        summary.b2csRateWise[key].sgst += vSummary.sgst * ratio;
                        summary.b2csRateWise[key].cess += vSummary.cess * ratio;
                    }
                }
            }

            if (vSummary.hsnData) {
                Object.entries(vSummary.hsnData).forEach(([code, data]) => {
                    if (!summary.hsn[code]) summary.hsn[code] = { ...data };
                    else {
                        summary.hsn[code].taxable += data.taxable;
                        summary.hsn[code].tax += data.tax;
                        summary.hsn[code].qty += data.qty;
                    }
                });
            }

            const docType = v.type === 'Sales' ? 'invoices' : (v.type === 'Credit Note' ? 'creditNotes' : (v.type === 'Debit Note' ? 'debitNotes' : null));
            if (docType) {
                const d = summary.docs[docType];
                if (!d.from) d.from = v.voucherNo;
                d.to = v.voucherNo;
                d.count++;
            }

            summary.consolidated.taxable += vSummary.taxableValue;
            summary.consolidated.cgst += vSummary.cgst;
            summary.consolidated.sgst += vSummary.sgst;
            summary.consolidated.igst += vSummary.igst;
            summary.consolidated.cess += vSummary.cess;
            summary.consolidated.tax += vSummary.totalTax;
            summary.consolidated.total += vSummary.invoiceValue;
        });

        return summary;
    }

    static aggregateSummaries(vouchers: Voucher[], ledgers: Ledger[] = []): TaxVoucherSummary {
        return vouchers.reduce((acc, v) => {
            const summary = this.calculateVoucherSummary(v, ledgers);
            return {
                taxableValue: acc.taxableValue + summary.taxableValue,
                cgst: acc.cgst + summary.cgst,
                sgst: acc.sgst + summary.sgst,
                igst: acc.igst + summary.igst,
                cess: acc.cess + summary.cess,
                totalTax: acc.totalTax + summary.totalTax,
                invoiceValue: acc.invoiceValue + summary.invoiceValue,
                category: acc.category
            };
        }, {
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
            totalTax: 0,
            invoiceValue: 0,
            category: 'B2CS' as const
        });
    }
}
