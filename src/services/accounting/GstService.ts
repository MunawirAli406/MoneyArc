import type { Voucher } from './VoucherService';

export interface GstVoucherSummary {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    invoiceValue: number;
}

export class GstService {
    /**
     * Identifies if an account is a tax ledger based on common naming patterns.
     */
    static isTaxLedger(accountName: string): boolean {
        const acc = accountName.toLowerCase();
        return acc.includes('gst') || acc.includes('tax') || acc.includes('duty') || acc.includes('cess');
    }

    /**
     * Calculates GST summary for a single voucher.
     */
    static calculateVoucherSummary(voucher: Voucher): GstVoucherSummary {
        let taxableValue = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        let totalTax = 0;
        let invoiceValue = 0;

        const isSales = voucher.type === 'Sales';
        const isPurchase = voucher.type === 'Purchase';

        voucher.rows.forEach(r => {
            const accName = r.account.toLowerCase();
            const isTax = this.isTaxLedger(r.account);
            const amount = r.debit || r.credit || 0;

            if (isSales) {
                if (r.type === 'Cr') {
                    if (isTax) {
                        if (accName.includes('cgst')) cgst += amount;
                        else if (accName.includes('sgst')) sgst += amount;
                        else if (accName.includes('igst')) igst += amount;
                        totalTax += amount;
                    } else {
                        taxableValue += amount;
                    }
                } else if (r.type === 'Dr') {
                    // non-tax debits in sales (Customer + Discounts) = Invoice Value
                    if (!isTax) {
                        invoiceValue += amount;
                    }
                }
            } else if (isPurchase) {
                if (r.type === 'Dr') {
                    if (isTax) {
                        if (accName.includes('cgst')) cgst += amount;
                        else if (accName.includes('sgst')) sgst += amount;
                        else if (accName.includes('igst')) igst += amount;
                        totalTax += amount;
                    } else {
                        taxableValue += amount;
                    }
                } else if (r.type === 'Cr') {
                    // non-tax credits in purchase (Vendor + Rebates) = Invoice Value
                    if (!isTax) {
                        invoiceValue += amount;
                    }
                }
            }
        });

        return {
            taxableValue,
            cgst,
            sgst,
            igst,
            totalTax,
            invoiceValue
        };
    }

    /**
     * Aggregate GST summary for a list of vouchers.
     */
    static aggregateSummaries(vouchers: Voucher[]): GstVoucherSummary {
        return vouchers.reduce((acc, v) => {
            const summary = this.calculateVoucherSummary(v);
            return {
                taxableValue: acc.taxableValue + summary.taxableValue,
                cgst: acc.cgst + summary.cgst,
                sgst: acc.sgst + summary.sgst,
                igst: acc.igst + summary.igst,
                totalTax: acc.totalTax + summary.totalTax,
                invoiceValue: acc.invoiceValue + summary.invoiceValue
            };
        }, {
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
            invoiceValue: 0
        });
    }
}
