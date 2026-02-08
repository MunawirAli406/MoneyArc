import React, { createContext, useContext, useState } from 'react';
import { ReportService } from '../../services/accounting/ReportService';

type SelectionType = 'Period' | 'Date';

interface DateContextType {
    startDate: string;
    endDate: string;
    selectionType: SelectionType;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    setSelectionType: (type: SelectionType) => void;
    setRange: (start: string, end: string) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: React.ReactNode }) {
    const [selectionType, setSelectionType] = useState<SelectionType>('Period');
    const [startDate, setStartDate] = useState(() => ReportService.getFinancialYearStart(new Date()));
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    const setRange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
    };

    return (
        <DateContext.Provider value={{
            startDate,
            endDate,
            selectionType,
            setStartDate,
            setEndDate,
            setSelectionType,
            setRange
        }}>
            {children}
        </DateContext.Provider>
    );
}

export function useReportDates() {
    const context = useContext(DateContext);
    if (context === undefined) {
        throw new Error('useReportDates must be used within a DateProvider');
    }
    return context;
}
