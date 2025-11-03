// 'use client';

// // 🚀 EXAMPLE: Ultra-Fast Trophy Room Component
// // 
// // This component demonstrates the instant cache system:
// // • First visit: ~200ms (normal speed)
// // • Second visit: 0ms (INSTANT!)
// // • Tab switch: 0ms (INSTANT!)
// // • Real-time updates: Automatic
// //
// // Usage: Copy this pattern to any component that needs instant loading

// import { useState, useEffect } from 'react';
// import { leagueAPI, onCacheUpdate, clearInstantCache, getCacheStats } from '@/lib/api-ultra-fast';
// import type { League } from '@/types/user';

// export default function TrophyRoomExample() {
//   const [leagues, setLeagues] = useState<League[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cacheInfo, setCacheInfo] = useState({ size: 0, age: 0 });
//   const [lastUpdate, setLastUpdate] = useState<string>('');

//   // Load leagues - INSTANT if cached!
//   useEffect(() => {
//     const startTime = Date.now();
    
//     async function loadLeagues() {
//       try {
//         console.log('🔄 Loading leagues...');
//         const response = await leagueAPI.getAll();
        
//         const loadTime = Date.now() - startTime;
//         console.log(`⚡ Loaded in ${loadTime}ms`);
        
//         if (response.success && response.leagues) {
//           setLeagues(response.leagues);
//           setCacheInfo({ 
//             size: response.leagues.length, 
//             age: loadTime 
//           });
//         }
//       } catch (error) {
//         console.error('❌ Failed to load leagues:', error);
//       } finally {
//         setLoading(false);
//       }
//     }
    
//     loadLeagues();
//   }, []);

//   // Listen for real-time updates
//   useEffect(() => {
//     console.log('👂 Listening for cache events...');
    
//     const unsubscribe = onCacheUpdate((event) => {
//       console.log('🔔 Cache event:', event.type);
//       setLastUpdate(event.type);
      
//       // Auto-reload on league changes
//       if (event.type.includes('league')) {
//         leagueAPI.getAll().then(res => {
//           if (res.success && res.leagues) {
//             setLeagues(res.leagues);
//             console.log('✅ Auto-updated leagues');
//           }
//         });
//       }
//     });
    
//     return () => {
//       console.log('👋 Unsubscribed from cache events');
//       unsubscribe();
//     };
//   }, []);

//   // Manual cache operations
//   const handleClearCache = () => {
//     clearInstantCache();
//     setLoading(true);
//     window.location.reload();
//   };

//   const handleRefresh = async () => {
//     setLoading(true);
//     try {
//       const response = await leagueAPI.getAll();
//       if (response.success && response.leagues) {
//         setLeagues(response.leagues);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const stats = getCacheStats();

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading... (First time: ~200ms)</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-6 max-w-6xl">
//       {/* Performance Info Banner */}
//       <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 mb-6 shadow-lg">
//         <h2 className="text-2xl font-bold mb-2">⚡ Ultra-Fast Cache Active!</h2>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//           <div>
//             <div className="font-semibold">Load Time</div>
//             <div className="text-2xl">{cacheInfo.age}ms</div>
//             <div className="text-xs opacity-75">
//               {cacheInfo.age === 0 ? 'INSTANT!' : 'First load'}
//             </div>
//           </div>
//           <div>
//             <div className="font-semibold">Cache Size</div>
//             <div className="text-2xl">{stats.size}</div>
//             <div className="text-xs opacity-75">items cached</div>
//           </div>
//           <div>
//             <div className="font-semibold">Leagues</div>
//             <div className="text-2xl">{leagues.length}</div>
//             <div className="text-xs opacity-75">loaded</div>
//           </div>
//           <div>
//             <div className="font-semibold">Last Event</div>
//             <div className="text-sm truncate">{lastUpdate || 'None'}</div>
//             <div className="text-xs opacity-75">real-time</div>
//           </div>
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="flex gap-4 mb-6">
//         <button
//           onClick={handleRefresh}
//           className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//         >
//           🔄 Refresh (Test Instant Cache)
//         </button>
//         <button
//           onClick={handleClearCache}
//           className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
//         >
//           🗑️ Clear Cache & Reload
//         </button>
//       </div>

//       {/* Instructions */}
//       <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
//         <h3 className="font-bold text-yellow-800 mb-2">💡 How to Test Instant Cache:</h3>
//         <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
//           <li>First visit: Notice load time (~200ms)</li>
//           <li>Click &ldquo;Refresh&rdquo; button: Should be INSTANT (0ms)!</li>
//           <li>Switch to another tab, then come back: INSTANT!</li>
//           <li>Refresh the page: Still INSTANT (localStorage persistence)!</li>
//           <li>Click &ldquo;Clear Cache&rdquo;: Next load will be ~200ms again</li>
//         </ol>
//       </div>

//       {/* Leagues Display */}
//       <div className="bg-white rounded-lg shadow-lg p-6">
//         <h2 className="text-2xl font-bold mb-4">
//           🏆 Your Trophy Room
//           <span className="text-sm text-gray-500 ml-2">({leagues.length} leagues)</span>
//         </h2>
        
//         {leagues.length === 0 ? (
//           <div className="text-center py-12 text-gray-500">
//             <p className="text-xl mb-2">No leagues yet</p>
//             <p className="text-sm">Join a league to see your trophies here!</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {leagues.map((league) => (
//               <div 
//                 key={league.id}
//                 className="border rounded-lg p-4 hover:shadow-md transition-shadow"
//               >
//                 <h3 className="font-bold text-lg mb-2">{league.name}</h3>
//                 <div className="text-sm text-gray-600 space-y-1">
//                   <p>📅 Created: {new Date(league.createdAt).toLocaleDateString()}</p>
//                   <p>👥 Members: {league.users?.length || 0}</p>
//                   <p>🎮 Matches: {league.matchCount || 0}</p>
//                 </div>
//                 {league.description && (
//                   <p className="text-sm text-gray-500 mt-2 line-clamp-2">
//                     {league.description}
//                   </p>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Cache Debug Info */}
//       <details className="mt-6 bg-gray-100 rounded-lg p-4">
//         <summary className="cursor-pointer font-semibold">
//           🔍 Cache Debug Info (for developers)
//         </summary>
//         <div className="mt-4 space-y-2 text-sm font-mono">
//           <div>
//             <strong>Cached Keys:</strong>
//             <ul className="list-disc list-inside ml-4 mt-1">
//               {stats.items.map((key: string) => (
//                 <li key={key} className="text-xs">{key}</li>
//               ))}
//             </ul>
//           </div>
//           <div>
//             <strong>localStorage Check:</strong>
//             <code className="block bg-white p-2 rounded mt-1 overflow-x-auto">
//               {typeof window !== 'undefined' && localStorage.getItem('cf_instant_cache_v2') 
//                 ? `✅ Cache persisted (${Math.round(localStorage.getItem('cf_instant_cache_v2')!.length / 1024)}KB)`
//                 : '❌ No cache in localStorage'}
//             </code>
//           </div>
//         </div>
//       </details>

//       {/* Performance Tips */}
//       <div className="mt-6 bg-blue-50 rounded-lg p-4">
//         <h3 className="font-bold text-blue-800 mb-2">🚀 Performance Tips:</h3>
//         <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
//           <li>Cache loads synchronously = 0ms delay on revisit</li>
//           <li>Background refresh happens after cache is returned</li>
//           <li>Real-time events keep all components in sync</li>
//           <li>localStorage persistence = instant even after page refresh</li>
//           <li>Smart invalidation = only affected data is refetched</li>
//         </ul>
//       </div>
//     </div>
//   );
// }

// // Export for use in trophy room page
// export { TrophyRoomExample };

// // Additional export showing how to use in any component
// export function useInstantLeagues() {
//   const [leagues, setLeagues] = useState<League[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     leagueAPI.getAll().then(res => {
//       if (res.success && res.leagues) {
//         setLeagues(res.leagues);
//       }
//       setLoading(false);
//     });

//     // Auto-update on changes
//     return onCacheUpdate((event) => {
//       if (event.type.includes('league')) {
//         leagueAPI.getAll().then(res => {
//           if (res.success && res.leagues) {
//             setLeagues(res.leagues);
//           }
//         });
//       }
//     });
//   }, []);

//   return { leagues, loading };
// }
