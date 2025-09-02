import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import AuthCheck from "@/Components/AuthCheck";
// import Mainbg from '@/Components/images/mainbg.webp'
import LayoutContent from './LayoutContent';
import Footer from "@/Components/footer/_components";
import ToasterProvider from '@/Components/ToasterProvider';

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
};

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
          <AuthCheck />
          <LayoutContent>
            {children}
            <Footer/>
          </LayoutContent>
          <ToasterProvider /> {/* mount once */}
        </Providers>
      </body>
    </html>
  );
}
