export interface UnitOfMeasure {
    id: string;
    name: string; // e.g., Pcs, Box
    formalName: string; // e.g., Pieces, Box of 10
    decimalPlaces: number;
    isCompound: boolean;
    baseUnitId?: string;
    multiplier?: number;
}

export interface StockGroup {
    id: string;
    name: string;
    parentGroupId?: string; // For hierarchy
}

export interface StockItem {
    id: string;
    name: string;
    groupId: string;
    unitId: string;
    sku?: string;
    description?: string;

    // Inventory Details
    openingStock: number;
    openingRate: number;
    openingValue: number;

    // Current State (Calculated/Cached)
    currentBalance?: number;
    currentRate?: number;
    currentValue?: number;

    // Tracking
    reorderLevel?: number;
    isBatchEnabled: boolean;
    isExpiryEnabled: boolean;

    // GST Details
    hsnCode?: string;
    gstRate?: number; // percentage
}
