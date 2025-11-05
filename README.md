# Thoth - Document Processing Pipeline

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

4. **Database (Neon PostgreSQL)**
   - Create a free account at [neon.tech](https://neon.tech/)
   - Create a new project and database
   - Copy the connection string for environment setup

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

3. **Database Setup**
   
   **Create Environment File:**
   ```bash
   cp .env.example .env.local
   ```
   
   **Configure Database Connection:**
   Add your Neon database connection string to `.env.local`:
   ```env
   # Neon PostgreSQL Database
   DATABASE_URL="postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
   
   **Run Database Migrations:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   
   **Seed Database (Optional):**
   ```bash
   npx prisma db seed
   ```

4. **Start Development Server**
4. **Start Development Server**
   ```bash
   pnpm dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000)

5. **Verify Setup**
   - Open your browser to `http://localhost:3000`
   - You should see the document parser interface
   - Try uploading a sample document from `public/data/documents/`
   - Check that database connection is working (no connection errors in console)

### Available Scripts

- **`pnpm dev`** - Start development server with hot reload
- **`pnpm build`** - Create production build
- **`pnpm start`** - Start production server (requires build first)
- **`pnpm lint`** - Run ESLint to check code quality
- **`pnpm test`** - Run tests once
- **`pnpm test:watch`** - Run tests in watch mode
- **`npx prisma studio`** - Open Prisma Studio for database management
- **`npx prisma generate`** - Generate Prisma client after schema changes
- **`npx prisma db push`** - Push database schema changes to Neon

### Project Architecture

This project follows **Domain-Driven Design (DDD)** principles. For detailed architectural guidelines, component patterns, and coding standards, see `.github/copilot-instructions.md`.

### Development Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow architectural guidelines in `.github/copilot-instructions.md`
   - Add tests for new functionality (colocated with source files)
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
- **Database connection errors**: 
  - Verify your Neon connection string in `.env.local`
  - Check that your Neon database is active (not sleeping)
  - Run `npx prisma db push` to sync schema changes
- **Prisma errors**: Run `npx prisma generate` after installing dependencies

**Getting Help:**
- Check existing issues in the GitHub repository
- Review the code comments and type definitions
- Test with sample documents in `public/data/documents/`

## Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **Database**: Neon (Serverless PostgreSQL) with Prisma ORM
- **Styling**: Tailwind CSS + Material-UI
- **Testing**: Vitest + Playwright
- **Package Manager**: pnpm

> **For Developers:** Detailed tech stack, coding standards, and architectural patterns are documented in `.github/copilot-instructions.md`

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

1. **Architecture**: Follow Domain-Driven Design principles outlined in `.github/copilot-instructions.md`
2. **Code Quality**: Maintain TypeScript strict mode compliance
3. **Testing**: Add colocated tests using React Testing Library patterns
4. **Documentation**: Update relevant documentation and comments

### Code Quality Checks

Run these commands before submitting:
```bash
pnpm lint    # Check for linting issues
pnpm test    # Run all tests
pnpm build   # Verify production build
```