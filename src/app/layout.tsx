import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/Components/Navbar/navbar";
import Footer from "@/Components/footer/footer";
import { Providers } from "@/lib/providers";
import AuthCheck from "@/Components/AuthCheck";
import Mainbg from '@/Components/images/mainbg.webp'

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
    <html lang="en">
      <body style={{
        backgroundImage: `url(${Mainbg.src})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
        // style={{ backgroundColor: '#d5ffd1'}}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AuthCheck />
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
