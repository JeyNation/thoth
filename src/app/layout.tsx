import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Purchase Order Management System',
  description: 'Document extraction and purchase order management tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <header className="app-header">
            <h1>Purchase Order Management System</h1>
          </header>
          <main className="app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}