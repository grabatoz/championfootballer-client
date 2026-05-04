"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import WorldRankingLoadingSkeleton from '@/Components/loading/WorldRankingLoadingSkeleton';

const WorldRankingTable = dynamic(() => import('./table'), {
  ssr: false,
  loading: () => <WorldRankingLoadingSkeleton />,
});

// export const metadata = { title: 'World Ranking | Champion Footballer' };

export default function WorldRankingPage(){
  return <WorldRankingTable />;
}
