export interface FormFieldConfig {
  id: string;
  label: string;
  kind: 'text' | 'textarea';
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

export const BASIC_INFO_FIELDS: FormFieldConfig[] = [
  {
    id: 'documentNumber',
    label: 'Document Number',
    kind: 'text',
    required: true,
  },
  {
    id: 'customerNumber',
    label: 'Customer Number',
    kind: 'text',
  },
  {
    id: 'shipToAddress',
    label: 'Ship To Address',
    kind: 'textarea',
    multiline: true,
    rows: 3,
  },
];

export const LINE_ITEM_FIELDS = {
  sku: { label: 'SKU', kind: 'text' as const },
  description: { label: 'Description', kind: 'textarea' as const },
  quantity: { label: 'Quantity', kind: 'integer' as const },
  unitPrice: { label: 'Unit Price', kind: 'decimal' as const },
};

// Map extraction rule field IDs to form field IDs
export const EXTRACTION_FIELD_MAPPING: Record<string, string> = {
  'ship-to': 'shipToAddress',
  'document-number': 'documentNumber',
  'customer-number': 'customerNumber',
};
