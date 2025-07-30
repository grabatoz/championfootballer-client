import React from 'react';
import PlayerDashboard from './_components';
import AuthCheck from '@/Components/AuthCheck';

const PlayerCardSection: React.FC = () => {  
  return (
    <>
      <AuthCheck />
      <PlayerDashboard/>
    </>
  );
};

export default PlayerCardSection;













// import PlayerCard from '@/Components/playercard/playercard';
// import React from 'react';

// const PlayerCardSection: React.FC = () => {
//   return (
//     <div className="relative w-full px-6 py-6 bg-gray-100">
//       <div
//         className="relative w-full bg-cover bg-center rounded-lg overflow-hidden"
//         style={{ backgroundImage: "url('/assets/image3.svg')" }}
//       >
//         {/* Player Card positioned flexibly */}
//         {/* min-sm:flex-row */}
//         <div className="flex flex-row items-center">
//           {/* Player card component (on left side for large screens) */}
//           <div className="w-[210px]">
//             <PlayerCard />
//           </div>

//           {/* Info Box */}
//           <div className="w-[42%] bg-white/80 p-6 rounded-lg shadow-md text-center lg:text-left z-10">
//             <h2 className="text-lg leading-5 font-bold text-gray-800 mb-2">Welcome, Unknown</h2>
//             <hr className="border-gray-300" />
//             <p className="text-gray-700 text-lg leading-6 ">
//               You haven't setup your Player Card yet.
//               Let's change that!
//             </p>
//             <button className="text-blue-600 font-semibold text-lg leading-6 hover:underline">
//               Edit Profile & Player Card
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PlayerCardSection;
