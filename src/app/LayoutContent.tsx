'use client';

import Navbar from "@/Components/Navbar/navbar";
import Footer from "@/Components/footer/footer";
import Mainbg from '@/Components/images/mainbg.webp'
import { usePathname } from 'next/navigation';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMainPage = pathname === '/';

  return (
    <>
      <div
        style={{
          backgroundImage: isMainPage ? 'none' : `url(${Mainbg.src})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        {!isMainPage && <Navbar />}
        {children}
        {!isMainPage && <Footer />}
      </div>
    </>
  );
}

export default LayoutContent; 