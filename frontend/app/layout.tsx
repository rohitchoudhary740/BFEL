import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BFEL FLOW - Cattle Feed Distribution & Operations Platform',
  description: 'Enterprise Distributor Management System (DMS) and Plant Operations Platform for Bharat Feeds & Extractions Ltd (Indore, MP).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
