# Thoth - Document Parser & Purchase Order Management System

A Next.js TypeScript application for parsing documents and managing purchase orders with intelligent field mapping and extraction capabilities.

## Features

- **Document Parsing**: Advanced document extraction engine for various document types
- **Two-Panel Interface**: Document viewer and interactive form for editing
- **Intelligent Field Mapping**: Automated field detection and mapping with visual feedback
- **Line Items Management**: Dynamic handling of line items with drag-and-drop functionality
- **Real-time Updates**: Changes in the form immediately reflect in the document view
- **Multi-format Support**: Support for various document formats (BC, MP, POS, Demo)
- **Layout Rules Engine**: Configurable rules for different document layouts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Setup Guide for New Contributors

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **pnpm** (Package Manager)
   ```bash
   npm install -g pnpm
   ```
   - Verify installation: `pnpm --version`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

### Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/JeyNation/thoth.git
   cd thoth
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```
   This will install all project dependencies as defined in `package.json` using the lockfile `pnpm-lock.yaml`.

3. **Start Development Server**
   ```bash
   pnpm dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000)

4. **Verify Setup**
   - Open your browser to `http://localhost:3000`
   - You should see the document parser interface
   - Try uploading a sample document from `public/data/documents/`

### Available Scripts

- **`pnpm dev`** - Start development server with hot reload
- **`pnpm build`** - Create production build
- **`pnpm start`** - Start production server (requires build first)
- **`pnpm lint`** - Run ESLint to check code quality
- **`pnpm test`** - Run tests once
- **`pnpm test:watch`** - Run tests in watch mode

### Project Structure Overview

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── services/              # Business logic and API services
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── styles/                # CSS and styling files

public/data/               # Sample documents and layout rules
```

### Development Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   pnpm test
   pnpm lint
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Open a PR against the `master` branch
   - Provide a clear description of your changes

### Troubleshooting

**Common Issues:**

- **Port already in use**: Change the port by setting `PORT=3001 pnpm dev`
- **Node version conflicts**: Use Node.js v18+ as specified in requirements
- **pnpm not found**: Install pnpm globally with `npm install -g pnpm`
- **Build failures**: Clear cache with `pnpm store prune` and reinstall

**Getting Help:**
- Check existing issues in the GitHub repository
- Review the code comments and type definitions
- Test with sample documents in `public/data/documents/`

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Material-UI (MUI)
- **State Management**: React Context
- **Testing**: Vitest with jsdom
- **Linting**: ESLint with TypeScript support
- **Package Manager**: pnpm
- **Build Tool**: Next.js built-in bundler

## Key Components

### Document Parser Engine
- Intelligent document field extraction
- Support for multiple document formats (BC, MP, POS, Demo)
- Configurable layout rules and field mapping

### Viewer Component
- Interactive document viewer with zoom and pan
- Area selection for field mapping
- Visual feedback for mapped fields

### Form Components
- Dynamic form generation based on document type
- Drag-and-drop field mapping interface
- Real-time validation and updates

### Mapping System
- Visual connection between document areas and form fields
- Undo/redo functionality for mapping operations
- Persistent storage of mapping configurations

## Usage

### Basic Document Processing

1. **Upload a Document**
   - Use the drag-and-drop zone or click to select a document
   - Supported formats include various business documents

2. **View Document**
   - The left panel displays the document with zoom and pan capabilities
   - Use mouse wheel to zoom, click and drag to pan

3. **Map Fields**
   - Select areas in the document by clicking and dragging
   - Drop selected areas onto form fields in the right panel
   - Visual connections show the mapping relationships

4. **Extract Data**
   - The extraction engine automatically processes mapped fields
   - Review and edit extracted data in the form
   - Save configurations for reuse with similar documents

### Advanced Features

- **Layout Rules**: Configure extraction rules for different document types
- **Undo/Redo**: Use Ctrl+Z / Ctrl+Y to undo/redo mapping operations
- **Field Validation**: Real-time validation ensures data accuracy
- **Batch Processing**: Process multiple documents with saved configurations

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Code Style**: Follow the existing TypeScript and React patterns
2. **Testing**: Add tests for new features using Vitest
3. **Documentation**: Update relevant documentation and comments
4. **Type Safety**: Maintain strict TypeScript compliance
5. **Performance**: Consider performance implications of changes

### Code Quality

The project uses several tools to maintain code quality:
- **ESLint**: For code linting and consistency
- **TypeScript**: For type safety and better developer experience
- **Vitest**: For unit and integration testing
- **Prettier**: For code formatting (if configured)

Run quality checks before submitting:
```bash
pnpm lint    # Check for linting issues
pnpm test    # Run all tests
pnpm build   # Verify production build
```