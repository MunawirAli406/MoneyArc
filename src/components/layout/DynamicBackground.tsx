import { useEffect } from 'react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { BASE_GRADIENT, BACKGROUNDS } from './backgrounds';

export default function DynamicBackground() {
    const { activeCompany } = usePersistence();
    const type = activeCompany?.businessType || 'General';
    const bgClass = BACKGROUNDS[type] || BACKGROUNDS['General'];

    useEffect(() => {
        console.log("DynamicBackground: Mounted. Active Company:", activeCompany?.name);
    }, [activeCompany]);

    return (
        <div className={`${BASE_GRADIENT} ${bgClass}`} />
    );
}
