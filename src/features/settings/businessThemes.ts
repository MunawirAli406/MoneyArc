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
        primary: '217 89% 61%', // Google Blue
        background: 'var(--background)',
        card: 'var(--card)',
        accent: 'var(--accent)',
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
    },
    Retail: {
        primary: '32 95% 50%', // Energetic Orange
        background: '35 30% 98%',
        card: '0 0% 100%',
        accent: '32 95% 95%',
        greeting: 'Store Dashboard',
        icon: 'ShoppingBag',
        revenueLabel: 'Total Sales',
        expenseLabel: 'Inventory Costs',
        description: 'Retail store management'
    },
    Manufacturing: {
        primary: '210 20% 40%', // Industrial Slate
        background: '210 15% 96%',
        card: '0 0% 100%',
        accent: '210 20% 90%',
        greeting: 'Factory Operations',
        icon: 'Factory',
        revenueLabel: 'Production Order',
        expenseLabel: 'Material Cost',
        description: 'Manufacturing & assembly'
    },
    Service: {
        primary: '230 80% 60%', // Calm Indigo
        background: '230 15% 98%',
        card: '0 0% 100%',
        accent: '230 80% 95%',
        greeting: 'Service Desk',
        icon: 'Briefcase',
        revenueLabel: 'Service Revenue',
        expenseLabel: 'Operational Cost',
        description: 'Service-based business'
    },
    RealEstate: {
        primary: '190 90% 45%', // Cyan/Teal
        background: '190 15% 98%',
        card: '0 0% 100%',
        accent: '190 90% 95%',
        greeting: 'Property Manager',
        icon: 'Building',
        revenueLabel: 'Rental Income',
        expenseLabel: 'Property Maintenance',
        description: 'Real estate management'
    },
    Technology: {
        primary: '260 90% 60%', // Cyber Violet
        background: '260 15% 98%',
        card: '0 0% 100%',
        accent: '260 90% 95%',
        greeting: 'Tech Hub',
        icon: 'Cpu',
        revenueLabel: 'Project Revenue',
        expenseLabel: 'Development Cost',
        description: 'IT & software services'
    },
    Logistics: {
        primary: '25 90% 50%', // Cargo Orange
        background: '30 15% 98%',
        card: '0 0% 100%',
        accent: '25 90% 95%',
        greeting: 'Fleet Control',
        icon: 'Truck',
        revenueLabel: 'Freight Revenue',
        expenseLabel: 'Fuel & Maintenance',
        description: 'Transport & logistics'
    },
    Agriculture: {
        primary: '100 80% 40%', // Leaf Green
        background: '100 15% 96%',
        card: '0 0% 100%',
        accent: '100 80% 90%',
        greeting: 'Farm Management',
        icon: 'Sprout',
        revenueLabel: 'Harvest Sales',
        expenseLabel: 'Cultivation Cost',
        description: 'Agriculture & farming'
    }
};
