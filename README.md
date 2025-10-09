# Purchase Order Management System

A React TypeScript application for managing purchase orders with a two-panel interface.

## Features

- **Left Panel**: Displays the purchase order document with formatted view
- **Right Panel**: Interactive form for editing purchase order details
- **Real-time Updates**: Changes in the form immediately reflect in the document view
- **Line Items Management**: Add, edit, and remove line items with automatic line numbering
- **Responsive Design**: Works on desktop and mobile devices

## Components

### PurchaseOrderDocument
Displays a formatted view of the purchase order including:
- Document number and customer number
- Ship-to address
- Line items table with totals
- Professional document layout

### PurchaseOrderForm
Interactive form with sections for:
- Basic information (document number, customer number, ship-to address)
- Line items management (SKU, description, quantity, unit price)
- Add/edit/remove line items functionality

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) to view the application

## Build

To build the project for production:
```bash
npm run build
```

## Technology Stack

- React 18
- TypeScript
- Vite
- CSS Grid/Flexbox for layout
- ESLint for code quality

## Usage

1. Fill in the basic information in the right panel:
   - Document Number
   - Customer Number
   - Ship To Address

2. Add line items using the form at the bottom of the right panel:
   - Enter SKU and Description (required)
   - Set Quantity and Unit Price
   - Click "Add Item" to add to the purchase order

3. Edit existing line items directly in the table
4. Remove line items using the "Remove" button
5. View the formatted document in the left panel

The application automatically calculates totals and updates the document view in real-time as you make changes.