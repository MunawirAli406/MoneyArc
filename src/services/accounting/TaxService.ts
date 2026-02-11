import type { Voucher } from './VoucherService';

export interface TaxVoucherSummary {
    taxableValue: number;
    tax1: number; // e.g., CGST
    tax2: number; // e.g., SGST
    tax3: number; // e.g., IGST / Other
    totalTax: number;
    invoiceValue: number;
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
     * Calculates tax summary for a single voucher.
     */
    static calculateVoucherSummary(voucher: Voucher): TaxVoucherSummary {
        let taxableValue = 0;
        let tax1 = 0;
        let tax2 = 0;
        let tax3 = 0;
        let totalTax = 0;
        let invoiceValue = 0;

        const isSales = voucher.type === 'Sales';
        const isPurchase = voucher.type === 'Purchase';

        // Keywords for tiered tax systems (like India's GST)
        // These can be passed or derived, but for now we keep it versatile
        const t1Tags = ['cgst', 'central'];
        const t2Tags = ['sgst', 'state'];
        const t3Tags = ['igst', 'integrated'];

        voucher.rows.forEach(r => {
            const accName = r.account.toLowerCase();
            const isTax = this.isTaxLedger(r.account);
            const amount = r.debit || r.credit || 0;

            if (isSales) {
                if (r.type === 'Cr') {
                    if (isTax) {
                        if (t1Tags.some(tag => accName.includes(tag))) tax1 += amount;
                        else if (t2Tags.some(tag => accName.includes(tag))) tax2 += amount;
                        else if (t3Tags.some(tag => accName.includes(tag))) tax3 += amount;
                        else tax1 += amount; // Default to tax1 if it's a generic tax account

                        totalTax += amount;
                    } else {
                        taxableValue += amount;
                    }
                } else if (r.type === 'Dr') {
                    if (!isTax) invoiceValue += amount;
                }
            } else if (isPurchase) {
                if (r.type === 'Dr') {
                    if (isTax) {
                        if (t1Tags.some(tag => accName.includes(tag))) tax1 += amount;
                        else if (t2Tags.some(tag => accName.includes(tag))) tax2 += amount;
                        else if (t3Tags.some(tag => accName.includes(tag))) tax3 += amount;
                        else tax1 += amount;

                        totalTax += amount;
                    } else {
                        taxableValue += amount;
                    }
                } else if (r.type === 'Cr') {
                    if (!isTax) invoiceValue += amount;
                }
            }
        });

        return {
            taxableValue,
            tax1,
            tax2,
            tax3,
            totalTax,
            invoiceValue
        };
    }

    static aggregateSummaries(vouchers: Voucher[]): TaxVoucherSummary {
        return vouchers.reduce((acc, v) => {
            const summary = this.calculateVoucherSummary(v);
            return {
                taxableValue: acc.taxableValue + summary.taxableValue,
                tax1: acc.tax1 + summary.tax1,
                tax2: acc.tax2 + summary.tax2,
                tax3: acc.tax3 + summary.tax3,
                totalTax: acc.totalTax + summary.totalTax,
                invoiceValue: acc.invoiceValue + summary.invoiceValue
            };
        }, {
            taxableValue: 0,
            tax1: 0,
            tax2: 0,
            tax3: 0,
            totalTax: 0,
            invoiceValue: 0
        });
    }
}
