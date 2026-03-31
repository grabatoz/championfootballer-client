import type { Metadata } from "next";
import { Anton, Inter, Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import AuthCheck from "@/Components/AuthCheck";
// import Mainbg from '@/Components/images/mainbg.webp'
import LayoutContent from './LayoutContent';
import Footer from "@/Components/footer/_components";
import ToasterProvider from '@/Components/ToasterProvider';
import AuthBootstrap from '@/Components/AuthBootstrap';
import PerformanceMonitor from '@/Components/PerformanceMonitor';
import ProductionOptimizer from '@/Components/ProductionOptimizer';
import FetchAuthMonitor from '@/Components/FetchAuthMonitor';
import RealtimeClient from '@/Components/RealtimeClient';
import RealtimeLatency from '@/Components/RealtimeLatency';
import GlobalCacheSync from '@/Components/GlobalCacheSync';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue'
});

const anton = Anton({ 
  weight: '400', // Anton font में केवल एक ही weight (400/regular) होता है
  subsets: ['latin'],
  variable: '--font-geist-anton'
});

const inter = Inter({
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-inter'
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Champion Footballer",
  description: "Your ultimate football management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  let apiHostname: string | null = null;
  try { apiHostname = new URL(apiUrl).hostname; } catch {}
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {apiHostname && (
          <>
            <link rel="dns-prefetch" href={`//${apiHostname}`} />
            <link rel="preconnect" href={apiUrl} crossOrigin="use-credentials" />
          </>
        )}
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${inter.variable} ${bebasNeue.variable} antialiased`}
      >
        <Providers>
          <ProductionOptimizer /> {/* Initialize production optimizations */}
          <FetchAuthMonitor /> {/* Global fetch auth injection & debug */}
          <RealtimeClient /> {/* Start SSE connection for realtime updates */}
          <GlobalCacheSync /> {/* Keep caches aligned across all routes on data mutations */}
          <AuthBootstrap />
          <AuthCheck />
          <LayoutContent>
            {children}
            <Footer/>
          </LayoutContent>
          <ToasterProvider /> {/* mount once */}
          <PerformanceMonitor /> {/* Performance monitoring in dev mode */}
          {process.env.NODE_ENV !== 'production' && <RealtimeLatency />}
        </Providers>
      </body>
    </html>
  );
}
