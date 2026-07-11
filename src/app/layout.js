import './globals.css';
import { ToastProvider } from '@/components/Toast';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'สั่งการ คลีน - ERP',
  description: 'ระบบ ERP บริษัท สั่งการ คลีน',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
