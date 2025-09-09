"use client";
import React from 'react';
import dynamic from 'next/dynamic';
const WorldRankingTable = dynamic(()=> import('./table'), { ssr:false });

// export const metadata = { title: 'World Ranking | Champion Footballer' };

export default function WorldRankingPage(){
  return <WorldRankingTable />;
}
