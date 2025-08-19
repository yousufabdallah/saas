import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'SaaSy - منصة المتاجر الإلكترونية',
  description: 'إنشئ متجرك الإلكتروني في دقائق مع حلول متقدمة ومرنة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}