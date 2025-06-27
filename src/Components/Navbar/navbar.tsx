'use client';
import React from 'react';
import NavigationBar from './_components';

function Navbar() {
  return (
    <NavigationBar />
  );
}

export default Navbar;
















// import Image from 'next/image'
// import Link from 'next/link'
// import React from 'react'

// function Navbar() {
//   return (
//     <nav className="flex items-center justify-between px-6 py-6 border-b shadow-lg border-gray-200">
//     {/* Logo */}
//     <div>
//     <Link href={'/'}>
//     <Image
//      src='/assets/cflogo.svg'
//      alt='cflogo'
//      height={100}
//      width={100}
//      className='h-[30%] w-[60%]'
//      />
//      </Link>
//     </div>

//     {/* Navigation Links */}
//     <div className="space-x-6 text-gray-700 leading-6 text-lg font-medium">
//       <Link href="/how-to-play" className="hover:underline">How to play</Link>
//       <Link href="/game-rules" className="hover:underline">Game rules</Link>
//       <Link href="/signout" className="hover:underline">Sign out</Link>
//     </div>
//   </nav>
//   )
// }

// export default Navbar