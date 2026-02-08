export interface BusinessTheme {
    primary: string;
    background: string;
    card: string;
    accent: string;
    greeting: string;
    icon: string;
    revenueLabel: string;
    expenseLabel: string;
    description: string;
}

export const BUSINESS_THEMES: Record<string, BusinessTheme> = {
    General: {
        primary: '174 100% 33%', // Refined Teal
        background: 'var(--background)',
        card: 'var(--card)',
        accent: '174 100% 20%',
        greeting: 'Management Dashboard',
        icon: 'Building2',
        revenueLabel: 'Total Revenue',
        expenseLabel: 'Total Expenses',
        description: 'Standard enterprise accounting'
    },
    Hotel: {
        primary: '45 90% 45%', // Gold
        background: '20 20% 8%', // Deeper Warm Dark
        card: '20 20% 12%',
        accent: '45 90% 15%',
        greeting: 'Hospitality Control',
        icon: 'Hotel',
        revenueLabel: 'Booking Revenue',
        expenseLabel: 'Property Costs',
        description: 'Luxury guest services & property management'
    },
    Automobile: {
        primary: '0 80% 55%', // Bright Red
        background: '210 20% 8%', // Midnight Industrial
        card: '210 20% 12%',
        accent: '0 80% 15%',
        greeting: 'Garage Operations',
        icon: 'Car',
        revenueLabel: 'Service Sales',
        expenseLabel: 'Parts & Labor',
        description: 'Automotive service & inventory'
    },
    Textiles: {
        primary: '280 80% 60%', // Vibrant Purple
        background: '280 30% 6%', // Deepest Royal Black
        card: '280 30% 10%',
        accent: '280 80% 20%',
        greeting: 'Textile Management',
        icon: 'Shirt',
        revenueLabel: 'Garment Sales',
        expenseLabel: 'Material Costs',
        description: 'Fabric manufacturing & retail'
    },
    Restaurant: {
        primary: '25 95% 50%', // Saturated Orange
        background: '15 25% 8%', // Dark Mahogany
        card: '15 25% 12%',
        accent: '25 95% 15%',
        greeting: 'Kitchen & Billing',
        icon: 'Utensils',
        revenueLabel: 'Dining Sales',
        expenseLabel: 'Kitchen Expenses',
        description: 'Casual & fine dining hospitality'
    },
    School: {
        primary: '215 90% 50%', // Royal Blue
        background: '220 30% 98%', // Academic White
        card: '0 0% 100%',
        accent: '215 90% 95%',
        greeting: 'Academic Administration',
        icon: 'GraduationCap',
        revenueLabel: 'Fee Collections',
        expenseLabel: 'Academic Costs',
        description: 'Educational institute records'
    },
    Hospital: {
        primary: '165 85% 45%', // Clinical Mint
        background: '180 30% 98%', // Sterile White
        card: '0 0% 100%',
        accent: '165 85% 95%',
        greeting: 'Healthcare System',
        icon: 'HeartPulse',
        revenueLabel: 'Patient Billing',
        expenseLabel: 'Medical Supplies',
        description: 'Medical practice & pharmacy'
    }
};
