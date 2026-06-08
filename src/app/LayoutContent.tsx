'use client';

import Navbar from "@/Components/Navbar/navbar";
// import Footer from "@/Components/footer/footer";
// import Mainbg from '@/Components/images/mainbg.webp'
// import Mainbg from '@/Components/images/newbg.png'
import Mainbg from '@/Components/images/bgall.png'
import { usePathname } from 'next/navigation';
import { Skeleton } from 'boneyard-js/react';
import { useEffect, useMemo, useState } from 'react';
import PageLoadingSkeleton from '@/Components/loading/PageLoadingSkeleton';
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

const PAGE_SKELETON_MIN_DURATION_MS = 650;

const toSkeletonName = (pathname: string) => {
  if (pathname === '/') return 'page-landing';
  if (pathname === '/home') return 'page-home-dashboard';
  if (pathname === '/all-leagues') return 'page-all-leagues';
  if (pathname === '/all-matches') return 'page-all-matches';
  if (pathname === '/all-players') return 'page-all-players';
  if (pathname === '/rewards') return 'page-rewards';
  if (pathname === '/trophy-room') return 'page-trophy-room';
  if (pathname === '/world-ranking') return 'page-world-ranking';
  if (pathname === '/profile') return 'page-profile-settings';
  if (pathname === '/dream-team') return 'page-dream-team';
  if (pathname === '/leader-board') return 'page-leader-board';
  if (pathname === '/contact') return 'page-contact';
  if (pathname === '/about' || pathname === '/privacy' || pathname === '/terms') return 'page-legal';
  if (/^\/league\/[^/]+$/.test(pathname)) return 'page-league-detail';
  if (/^\/league\/[^/]+\/trophy-room$/.test(pathname)) return 'page-league-trophy-room';
  if (/^\/league\/[^/]+\/match$/.test(pathname)) return 'page-schedule-match';
  if (/^\/league\/[^/]+\/match\/[^/]+\/edit$/.test(pathname)) return 'page-edit-match';
  if (/^\/league\/[^/]+\/match\/[^/]+\/play$/.test(pathname)) return 'page-play-match';
  if (/^\/match\/[^/]+$/.test(pathname)) return 'page-match-result';
  if (/^\/player\/[^/]+$/.test(pathname)) return 'page-player-profile';
  if (/^\/player\/[^/]+\/career$/.test(pathname)) return 'page-player-career';

  const slug = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (/^\d+$/.test(segment)) return 'id';
      return segment.replace(/[^a-zA-Z0-9-_]/g, '-');
    })
    .join('-');

  return `page-${slug || 'home'}`;
};

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const resolvedPathname = pathname ?? '';
  const isMainPage = resolvedPathname === '/';
  const isHomeDashboard = resolvedPathname === '/home';
  const isAllLeaguesPage = resolvedPathname === '/all-leagues';
  const isAllMatchesPage = resolvedPathname === '/all-matches';
  const isAllPlayersPage = resolvedPathname === '/all-players';
  const isRewardsPage = resolvedPathname === '/rewards';
  const isTrophyRoomPage = resolvedPathname === '/trophy-room';
  const isWorldRankingPage = resolvedPathname === '/world-ranking';
  const isProfileSettingsPage = resolvedPathname === '/profile';
  const isDreamTeamPage = resolvedPathname === '/dream-team';
  const isLeaderBoardPage = resolvedPathname === '/leader-board';
  const isContactPage = resolvedPathname === '/contact';
  const isLegalPage = resolvedPathname === '/about' || resolvedPathname === '/privacy' || resolvedPathname === '/terms';
  const isLeagueDetailPage = /^\/league\/[^/]+$/.test(resolvedPathname);
  const isLeagueTrophyRoomPage = /^\/league\/[^/]+\/trophy-room$/.test(resolvedPathname);
  const isScheduleMatchPage = /^\/league\/[^/]+\/match$/.test(resolvedPathname);
  const isLeagueEditMatchPage = /^\/league\/[^/]+\/match\/[^/]+\/edit$/.test(resolvedPathname);
  const isLeaguePlayMatchPage = /^\/league\/[^/]+\/match\/[^/]+\/play$/.test(resolvedPathname);
  const isMatchResultPage = /^\/match\/[^/]+$/.test(resolvedPathname);
  const isPlayerProfilePage = /^\/player\/[^/]+$/.test(resolvedPathname);
  const isPlayerCareerPage = /^\/player\/[^/]+\/career$/.test(resolvedPathname);

  const shouldUseRouteSkeleton =
    isMainPage ||
    isHomeDashboard ||
    isAllLeaguesPage ||
    isAllMatchesPage ||
    isAllPlayersPage ||
    isRewardsPage ||
    isTrophyRoomPage ||
    isWorldRankingPage ||
    isProfileSettingsPage ||
    isDreamTeamPage ||
    isLeaderBoardPage ||
    isContactPage ||
    isLegalPage ||
    isLeagueDetailPage ||
    isLeagueTrophyRoomPage ||
    isScheduleMatchPage ||
    isLeagueEditMatchPage ||
    isLeaguePlayMatchPage ||
    isMatchResultPage ||
    isPlayerProfilePage ||
    isPlayerCareerPage;

  const routeFallback = isHomeDashboard
    ? <HomeDashboardLoadingSkeleton />
    : isAllLeaguesPage
      ? <AllLeaguesLoadingSkeleton />
      : isAllMatchesPage
        ? <AllMatchesLoadingSkeleton />
        : isAllPlayersPage
          ? <AllPlayersLoadingSkeleton />
          : isRewardsPage
            ? <RewardsLoadingSkeleton />
            : isTrophyRoomPage
              ? <TrophyRoomLoadingSkeleton />
              : isWorldRankingPage
                ? <WorldRankingLoadingSkeleton />
                : isProfileSettingsPage
                  ? <ProfileSettingsLoadingSkeleton />
                  : isDreamTeamPage
                    ? <DreamTeamLoadingSkeleton />
                    : isLeaderBoardPage
                      ? <LeaderBoardLoadingSkeleton />
                      : isContactPage
                        ? <ContactPageLoadingSkeleton />
                        : isLegalPage
                          ? <LegalPageLoadingSkeleton />
                          : isLeagueDetailPage
                            ? <LeagueDetailLoadingSkeleton />
                            : isLeagueTrophyRoomPage
                              ? <TrophyRoomLoadingSkeleton />
                              : isScheduleMatchPage
                                ? <ScheduleMatchLoadingSkeleton />
                                : isLeagueEditMatchPage
                                  ? <EditMatchPopupLoadingSkeleton mode="page" />
                                  : isLeaguePlayMatchPage
                                    ? <MatchResultLoadingSkeleton />
                                    : isMatchResultPage
                                      ? <MatchResultLoadingSkeleton />
                                      : isPlayerCareerPage
                                        ? <PlayerCareerLoadingSkeleton />
                                        : isPlayerProfilePage
                                          ? <PlayerProfileLoadingSkeleton />
                                          : <PageLoadingSkeleton />;
  const [showPageSkeleton, setShowPageSkeleton] = useState(true);

  useEffect(() => {
    if (!shouldUseRouteSkeleton) {
      setShowPageSkeleton(false);
      return;
    }

    setShowPageSkeleton(true);
    const timer = window.setTimeout(() => {
      setShowPageSkeleton(false);
    }, PAGE_SKELETON_MIN_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [resolvedPathname, shouldUseRouteSkeleton]);

  const skeletonName = useMemo(() => toSkeletonName(resolvedPathname), [resolvedPathname]);

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
          maxWidth: '100%',
          overflowX: 'hidden',
          backgroundColor: 'black',
        }}
      >
        {!isMainPage && <Navbar />}
        <Skeleton
          name={skeletonName}
          loading={shouldUseRouteSkeleton && showPageSkeleton}
          animate="shimmer"
          transition={250}
          fallback={routeFallback}
          snapshotConfig={{ excludeTags: ['nav', 'footer', 'aside'] }}
        >
          {children}
        </Skeleton>
        {/* {!isMainPage && <Footer />} */}
      </div>
    </>
  );
}

export default LayoutContent; 
