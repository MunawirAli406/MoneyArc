import { useMemo } from 'react';
import { usePersistence } from '../services/persistence/PersistenceContext';
import { LocalizationService } from '../services/localization/LocalizationService';

export function useLocalization() {
    const { activeCompany } = usePersistence();

    const localization = useMemo(() => {
        return LocalizationService.getLocalization(activeCompany?.country);
    }, [activeCompany?.country]);

    const formatCurrency = (amount: number) => {
        return LocalizationService.formatCurrency(amount, activeCompany?.symbol);
    };

    return {
        ...localization,
        symbol: activeCompany?.symbol || '₹',
        currency: activeCompany?.currency || 'INR',
        formatCurrency,
        companyName: activeCompany?.name || 'My Company'
    };
}
