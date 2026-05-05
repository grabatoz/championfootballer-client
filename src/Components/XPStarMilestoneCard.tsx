'use client';

import React from 'react';
import { Box } from '@mui/material';
import starrImg from '@/Components/images/starr.png';

export type XPTier = {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  cardColor: string;
  starColor: string;
  description: string;
  isGoat?: boolean;
};

export const XP_TIERS: XPTier[] = [
  {
    level: 1,
    title: 'Rookie',
    minXP: 0,
    maxXP: 500,
    cardColor: '#B0B0B0',
    starColor: '#7A7A7A',
    description: 'Building your way to football dominance, all the way to Champion Footballer.',
  },
  {
    level: 2,
    title: 'Rising Star',
    minXP: 500,
    maxXP: 2500,
    cardColor: '#4AA3FF',
    starColor: '#1F6FBF',
    description: 'Rising in prominence with every performance.',
  },
  {
    level: 3,
    title: 'Baller',
    minXP: 2500,
    maxXP: 5000,
    cardColor: '#00A86B', // CF Green
    starColor: '#007C4E',
    description: "A force on the field that can't be ignored.",
  },
  {
    level: 4,
    title: 'The Specialist',
    minXP: 5000,
    maxXP: 8000,
    cardColor: '#9B59B6',
    starColor: '#6F2E8A',
    description: 'High mastery and control over matches with consistent dominance.',
  },
  {
    level: 5,
    title: 'Elite',
    minXP: 8000,
    maxXP: 11000,
    cardColor: '#3448FF',
    starColor: '#1D2DB5',
    description: 'Known for unwavering talent and a relentless winning mentality.',
  },
  {
    level: 6,
    title: 'Champion Footballer',
    minXP: 11000,
    maxXP: 15000,
    cardColor: '#E74C3C',
    starColor: '#A8281C',
    description: 'A benchmark of excellence. Respected as a true icon of the game.',
  },
  {
    level: 7,
    title: 'GOAT',
    minXP: 15000,
    maxXP: Infinity,
    cardColor: '#F1C40F',
    starColor: '#A67C00',
    description:
      'Feared by opponents and cemented in history as one of the greatest of all time.',
    isGoat: true,
  },
];

export function getXPTier(xp: number): XPTier {
  const safeXP = Number.isFinite(xp) ? xp : 0;
  return (
    XP_TIERS.find((tier) => safeXP >= tier.minXP && safeXP < tier.maxXP) || XP_TIERS[0]
  );
}

type XPStarMilestoneCardProps = {
  xp: number | string;
  className?: string;
  size?: number;
  width?: number;
  height?: number;
  colorOverride?: string;
};

export default function XPStarMilestoneCard({
  xp,
  className,
  size = 56,
  width,
  height,
  colorOverride,
}: XPStarMilestoneCardProps) {
  const parsedXP = Number(xp);
  const tier = getXPTier(parsedXP);
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;

  return (
    <Box
      className={className}
      sx={{
        width: resolvedWidth,
        height: resolvedHeight,
        display: 'inline-block',
        bgcolor: colorOverride ?? tier.starColor,
        WebkitMaskImage: `url(${starrImg.src})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskImage: `url(${starrImg.src})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        flexShrink: 0,
      }}
    />
  );
}

