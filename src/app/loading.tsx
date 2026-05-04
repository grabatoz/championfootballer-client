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
  const resolvedPathname = pathname ?? '';

  if (resolvedPathname === '/') {
    return <PageLoadingSkeleton />;
  }

  if (resolvedPathname === '/home') {
    return <HomeDashboardLoadingSkeleton />;
  }

  if (resolvedPathname === '/all-leagues') {
    return <AllLeaguesLoadingSkeleton />;
  }

  if (resolvedPathname === '/all-matches') {
    return <AllMatchesLoadingSkeleton />;
  }

  if (resolvedPathname === '/all-players') {
    return <AllPlayersLoadingSkeleton />;
  }

  if (resolvedPathname === '/rewards') {
    return <RewardsLoadingSkeleton />;
  }

  if (resolvedPathname === '/trophy-room') {
    return <TrophyRoomLoadingSkeleton />;
  }

  if (resolvedPathname === '/world-ranking') {
    return <WorldRankingLoadingSkeleton />;
  }

  if (resolvedPathname === '/profile') {
    return <ProfileSettingsLoadingSkeleton />;
  }

  if (resolvedPathname === '/dream-team') {
    return <DreamTeamLoadingSkeleton />;
  }

  if (resolvedPathname === '/leader-board') {
    return <LeaderBoardLoadingSkeleton />;
  }

  if (resolvedPathname === '/contact') {
    return <ContactPageLoadingSkeleton />;
  }

  if (resolvedPathname === '/about' || resolvedPathname === '/privacy' || resolvedPathname === '/terms') {
    return <LegalPageLoadingSkeleton />;
  }

  if (/^\/league\/[^/]+$/.test(resolvedPathname)) {
    return <LeagueDetailLoadingSkeleton />;
  }

  if (/^\/league\/[^/]+\/trophy-room$/.test(resolvedPathname)) {
    return <TrophyRoomLoadingSkeleton />;
  }

  if (/^\/league\/[^/]+\/match$/.test(resolvedPathname)) {
    return <ScheduleMatchLoadingSkeleton />;
  }

  if (/^\/league\/[^/]+\/match\/[^/]+\/edit$/.test(resolvedPathname)) {
    return <EditMatchPopupLoadingSkeleton mode="page" />;
  }

  if (/^\/league\/[^/]+\/match\/[^/]+\/play$/.test(resolvedPathname)) {
    return <MatchResultLoadingSkeleton />;
  }

  if (/^\/player\/[^/]+\/career$/.test(resolvedPathname)) {
    return <PlayerCareerLoadingSkeleton />;
  }

  if (/^\/player\/[^/]+$/.test(resolvedPathname)) {
    return <PlayerProfileLoadingSkeleton />;
  }

  if (/^\/match\/[^/]+$/.test(resolvedPathname)) {
    return <MatchResultLoadingSkeleton />;
  }

  return null;
}
