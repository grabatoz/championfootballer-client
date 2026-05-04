'use client';

import HomeDashboardLoadingSkeleton from '@/Components/loading/HomeDashboardLoadingSkeleton';
import AllLeaguesLoadingSkeleton from '@/Components/loading/AllLeaguesLoadingSkeleton';
import AllMatchesLoadingSkeleton from '@/Components/loading/AllMatchesLoadingSkeleton';
import LeagueDetailLoadingSkeleton from '@/Components/loading/LeagueDetailLoadingSkeleton';
import AllPlayersLoadingSkeleton from '@/Components/loading/AllPlayersLoadingSkeleton';
import RewardsLoadingSkeleton from '@/Components/loading/RewardsLoadingSkeleton';
import TrophyRoomLoadingSkeleton from '@/Components/loading/TrophyRoomLoadingSkeleton';
import PlayerProfileLoadingSkeleton from '@/Components/loading/PlayerProfileLoadingSkeleton';
import PlayerCareerLoadingSkeleton from '@/Components/loading/PlayerCareerLoadingSkeleton';
import WorldRankingLoadingSkeleton from '@/Components/loading/WorldRankingLoadingSkeleton';
import ProfileSettingsLoadingSkeleton from '@/Components/loading/ProfileSettingsLoadingSkeleton';
import MatchResultLoadingSkeleton from '@/Components/loading/MatchResultLoadingSkeleton';
import DreamTeamLoadingSkeleton from '@/Components/loading/DreamTeamLoadingSkeleton';
import LeaderBoardLoadingSkeleton from '@/Components/loading/LeaderBoardLoadingSkeleton';
import LegalPageLoadingSkeleton from '@/Components/loading/LegalPageLoadingSkeleton';
import ContactPageLoadingSkeleton from '@/Components/loading/ContactPageLoadingSkeleton';
import ScheduleMatchLoadingSkeleton from '@/Components/loading/ScheduleMatchLoadingSkeleton';
import EditMatchPopupLoadingSkeleton from '@/Components/loading/EditMatchPopupLoadingSkeleton';
import PageLoadingSkeleton from '@/Components/loading/PageLoadingSkeleton';
import { usePathname } from 'next/navigation';

export default function Loading() {
  const pathname = usePathname();

  if (pathname === '/') {
    return <PageLoadingSkeleton />;
  }

  if (pathname === '/home') {
    return <HomeDashboardLoadingSkeleton />;
  }

  if (pathname === '/all-leagues') {
    return <AllLeaguesLoadingSkeleton />;
  }

  if (pathname === '/all-matches') {
    return <AllMatchesLoadingSkeleton />;
  }

  if (pathname === '/all-players') {
    return <AllPlayersLoadingSkeleton />;
  }

  if (pathname === '/rewards') {
    return <RewardsLoadingSkeleton />;
  }

  if (pathname === '/trophy-room') {
    return <TrophyRoomLoadingSkeleton />;
  }

  if (pathname === '/world-ranking') {
    return <WorldRankingLoadingSkeleton />;
  }

  if (pathname === '/profile') {
    return <ProfileSettingsLoadingSkeleton />;
  }

  if (pathname === '/dream-team') {
    return <DreamTeamLoadingSkeleton />;
  }

  if (pathname === '/leader-board') {
    return <LeaderBoardLoadingSkeleton />;
  }

  if (pathname === '/contact') {
    return <ContactPageLoadingSkeleton />;
  }

  if (pathname === '/about' || pathname === '/privacy' || pathname === '/terms') {
    return <LegalPageLoadingSkeleton />;
  }

  if (/^\/league\/[^/]+$/.test(pathname)) {
    return <LeagueDetailLoadingSkeleton />;
  }

  if (/^\/league\/[^/]+\/trophy-room$/.test(pathname)) {
    return <TrophyRoomLoadingSkeleton />;
  }

  if (/^\/league\/[^/]+\/match$/.test(pathname)) {
    return <ScheduleMatchLoadingSkeleton />;
  }

  if (/^\/league\/[^/]+\/match\/[^/]+\/edit$/.test(pathname)) {
    return <EditMatchPopupLoadingSkeleton mode="page" />;
  }

  if (/^\/league\/[^/]+\/match\/[^/]+\/play$/.test(pathname)) {
    return <MatchResultLoadingSkeleton />;
  }

  if (/^\/player\/[^/]+\/career$/.test(pathname)) {
    return <PlayerCareerLoadingSkeleton />;
  }

  if (/^\/player\/[^/]+$/.test(pathname)) {
    return <PlayerProfileLoadingSkeleton />;
  }

  if (/^\/match\/[^/]+$/.test(pathname)) {
    return <MatchResultLoadingSkeleton />;
  }

  return null;
}
