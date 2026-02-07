export type Transaction = {
    id: string;
    amount: number;
    category: string;
    date: string; // ISO format date string
    description?: string;
};