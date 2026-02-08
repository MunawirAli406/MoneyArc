export interface Currency {
    code: string;
    symbol: string;
    label: string;
}

export const CURRENCIES: Currency[] = [
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
    { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
    { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (CAD)' },
    { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham (AED)' },
    { code: 'SAR', symbol: '﷼', label: 'Saudi Riyal (SAR)' },
    { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)' },
];
