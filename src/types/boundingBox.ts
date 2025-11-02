export interface BoundingBox {
    id: string;
    fieldId: string;
    fieldText: string;
    page: number;
    points: Array<{ x: number; y: number }>;
}
