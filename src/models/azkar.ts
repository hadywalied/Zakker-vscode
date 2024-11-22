export interface Zekr {
    zekr: string;
    description?: string;
    count?: number;
    reference?: string;
    search?: string;
}

export interface Category {
    name: string;
    search: string;
}

export interface Azkar {
    category: Category;
    zikr: Zekr[];
}