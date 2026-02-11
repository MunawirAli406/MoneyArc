export interface TaxConfiguration {
    taxName: string; // e.g., GST, VAT, Sales Tax
    isTiered: boolean; // True for CGST/SGST/IGST structure
    labels: {
        total: string;
        taxable: string;
        tier1?: string; // CGST
        tier2?: string; // SGST
        tier3?: string; // IGST
    };
    idLabel: string; // e.g., GSTIN, TRN, Tax ID
    itemCodeLabel: string; // e.g., HSN/SAC, Commodity Code, SKU
    itcLabel: string; // e.g., ITC, Input Tax, Tax Credit
    outwardTaxLabel: string; // e.g., Outward Tax, Output Tax
    summaryLabel: string; // e.g., Self-Assessment, Tax Summary
}

export const COUNTRY_LOCALIZATION: Record<string, { tax: TaxConfiguration; valuationLabel: string }> = {
    "India": {
        tax: {
            taxName: "GST",
            isTiered: true,
            labels: {
                total: "GST Total",
                taxable: "Taxable Value",
                tier1: "CGST",
                tier2: "SGST",
                tier3: "IGST"
            },
            idLabel: "GSTIN",
            itemCodeLabel: "HSN/SAC",
            itcLabel: "ITC",
            outwardTaxLabel: "Outward Tax",
            summaryLabel: "Self-Assessment"
        },
        valuationLabel: "Valuation"
    },
    "United Arab Emirates": {
        tax: {
            taxName: "VAT",
            isTiered: false,
            labels: {
                total: "VAT Total",
                taxable: "Excl. VAT Amount"
            },
            idLabel: "TRN",
            itemCodeLabel: "Commodity Code",
            itcLabel: "Input VAT",
            outwardTaxLabel: "Output VAT",
            summaryLabel: "VAT Return"
        },
        valuationLabel: "Total Value"
    },
    "United States": {
        tax: {
            taxName: "Sales Tax",
            isTiered: false,
            labels: {
                total: "Sales Tax",
                taxable: "Amount before Tax"
            },
            idLabel: "Tax ID",
            itemCodeLabel: "SKU/Code",
            itcLabel: "Tax Credit",
            outwardTaxLabel: "Sales Tax",
            summaryLabel: "Tax Summary"
        },
        valuationLabel: "Extended Amount"
    },
    "United Kingdom": {
        tax: {
            taxName: "VAT",
            isTiered: false,
            labels: {
                total: "VAT",
                taxable: "Net Amount"
            },
            idLabel: "VAT Reg No",
            itemCodeLabel: "Commodity Code",
            itcLabel: "Input VAT",
            outwardTaxLabel: "Output VAT",
            summaryLabel: "VAT Return"
        },
        valuationLabel: "Total"
    },
    "Canada": {
        tax: {
            taxName: "HST/GST",
            isTiered: false,
            labels: {
                total: "Total Tax",
                taxable: "Taxable Amount"
            },
            idLabel: "Business No",
            itemCodeLabel: "Code",
            itcLabel: "Input Tax Credit",
            outwardTaxLabel: "Output Tax",
            summaryLabel: "Tax Filing"
        },
        valuationLabel: "Amount"
    },
    "Australia": {
        tax: {
            taxName: "GST",
            isTiered: false,
            labels: {
                total: "GST",
                taxable: "Subtotal"
            },
            idLabel: "ABN",
            itemCodeLabel: "Code",
            itcLabel: "Input Tax Credit",
            outwardTaxLabel: "Output Tax",
            summaryLabel: "Tax Summary"
        },
        valuationLabel: "Value"
    }
};

const DEFAULT_LOCALIZATION = COUNTRY_LOCALIZATION["India"];

export class LocalizationService {
    static getLocalization(country: string = "India") {
        return COUNTRY_LOCALIZATION[country] || DEFAULT_LOCALIZATION;
    }

    static formatCurrency(amount: number, symbol: string = "₹") {
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
