import { Readex_Pro } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';

const font = Readex_Pro({ subsets: ['arabic', 'latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-ui' });

export const metadata = { title: 'Claude Monitor · قيمة تك', robots: { index: false }, icons: { icon: '/qt.png' } };

export default async function RootLayout({ children }) {
  const theme = (await cookies()).get('theme')?.value;
  return (
    <html lang="ar" dir="rtl" className={font.variable} data-theme={theme === 'light' || theme === 'dark' ? theme : undefined}>
      <body>{children}</body>
    </html>
  );
}
