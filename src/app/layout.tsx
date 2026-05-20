import type { Metadata } from "next";
import { Anton, Inter, Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import "./bones/registry";
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

// Woodford Bourne Pro loaded via next/font/local so it is bundled into
// /_next/static/ and works correctly in standalone/production deployments
// (output: 'standalone' does NOT copy the public/ folder, so @font-face
//  pointing to /assets/fonts/ would return 404 on production).
const woodfordBournePro = localFont({
  src: [
    { path: '../../public/assets/fonts/WoodfordBournePro-Thin.woff2',        weight: '100', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-ThinItalic.woff2',  weight: '100', style: 'italic' },
    { path: '../../public/assets/fonts/WoodfordBournePro-ExtraLight.woff2',  weight: '200', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-ExtLtIta.woff2',    weight: '200', style: 'italic' },
    { path: '../../public/assets/fonts/WoodfordBournePro-Light.woff2',       weight: '300', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-LightItalic.woff2', weight: '300', style: 'italic' },
    { path: '../../public/assets/fonts/WoodfordBournePro-Regular.woff2',     weight: '400', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-Italic.woff2',      weight: '400', style: 'italic' },
    { path: '../../public/assets/fonts/WoodfordBournePro-Medium.woff2',      weight: '500', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-MedIta.woff2',      weight: '500', style: 'italic' },
    { path: '../../public/assets/fonts/WoodfordBournePro-SemiBold.woff2',    weight: '600', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-SemBdIta.woff2',    weight: '600', style: 'italic' },
    { path: '../../public/assets/fonts/WoodfordBournePro-Bold.woff2',        weight: '700', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-BoldItalic.woff2',  weight: '700', style: 'italic' },
    { path: '../../public/assets/fonts/WoodfordBournePro-Black.woff2',       weight: '900', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-BlackItalic.woff2', weight: '900', style: 'italic' },
    { path: '../../public/assets/fonts/WoodfordBournePro-Ultra.woff2',       weight: '950', style: 'normal' },
    { path: '../../public/assets/fonts/WoodfordBournePro-UltraItalic.woff2', weight: '950', style: 'italic' },
  ],
  variable: '--font-woodford-bourne-pro',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue'
});

const anton = Anton({ 
  weight: '400',
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
        className={`${woodfordBournePro.variable} ${geistSans.variable} ${geistMono.variable} ${anton.variable} ${inter.variable} ${bebasNeue.variable} antialiased`}
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
