import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
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
import WebVitalsMonitor from '@/Components/WebVitalsMonitor';
import EnhancedPerformanceMonitor from '@/Components/EnhancedPerformanceMonitor';
import { registerServiceWorker } from '@/lib/registerServiceWorker';

const anton = Anton({ 
  weight: '400', // Anton font में केवल एक ही weight (400/regular) होता है
  subsets: ['latin'],
  variable: '--font-geist-anton'
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
  manifest: "/manifest.json",
  themeColor: "#4CAF50",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Champion Footballer",
  },
};

// Register service worker on mount
if (typeof window !== 'undefined') {
  registerServiceWorker();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${anton.variable}`}
      >
        <Providers>
          <ProductionOptimizer /> {/* Initialize production optimizations */}
          <WebVitalsMonitor /> {/* Core Web Vitals tracking */}
          <EnhancedPerformanceMonitor /> {/* Enhanced performance monitoring */}
          <AuthBootstrap />
          <AuthCheck />
          <LayoutContent>
            {children}
            <Footer/>
          </LayoutContent>
          <ToasterProvider /> {/* mount once */}
          <PerformanceMonitor /> {/* Performance monitoring in dev mode */}
        </Providers>
      </body>
    </html>
  );
}
