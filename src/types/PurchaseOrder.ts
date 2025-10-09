export interface LineItem {
  lineNumber: number;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  documentNumber: string;
  customerNumber: string;
  shipToAddress: string;
  lineItems: LineItem[];
}