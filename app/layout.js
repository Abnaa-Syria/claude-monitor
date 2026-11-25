import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const font = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '700'], variable: '--font-ar' });

export const metadata = { title: 'Claude Monitor', robots: { index: false } };

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
