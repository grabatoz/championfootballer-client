type LeagueDetailLoadingSkeletonProps = {
  mode?: 'page' | 'dream' | 'list';
};

export default function LeagueDetailLoadingSkeleton({ mode = 'page' }: LeagueDetailLoadingSkeletonProps) {
  if (mode === 'dream') {
    return (
      <div className="league-detail-dream-loading" role="status" aria-live="polite" aria-busy="true">
        <div className="route-loading-bone league-detail-dream-loading-field" />
      </div>
    );
  }

  if (mode === 'list') {
    return (
      <div className="league-detail-list-loading" role="status" aria-live="polite" aria-busy="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="route-loading-bone league-detail-list-loading-row" />
        ))}
      </div>
    );
  }

  return (
    <div className="league-detail-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone league-detail-loading-header" />

      <div className="league-detail-loading-tabs">
        <div className="route-loading-bone league-detail-loading-tab" />
        <div className="route-loading-bone league-detail-loading-tab" />
        <div className="route-loading-bone league-detail-loading-tab" />
        <div className="route-loading-bone league-detail-loading-tab" />
      </div>

      <div className="league-detail-loading-cards league-detail-loading-cards--summary">
        <div className="route-loading-bone league-detail-loading-card" />
        <div className="route-loading-bone league-detail-loading-card" />
        <div className="route-loading-bone league-detail-loading-card" />
      </div>

      <div className="league-detail-loading-layout">
        <div className="route-loading-bone league-detail-loading-panel league-detail-loading-panel--main">
          <div className="route-loading-bone league-detail-loading-panel-head" />
          <div className="league-detail-loading-panel-list">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="route-loading-bone league-detail-loading-panel-row" />
            ))}
          </div>
        </div>

        <div className="league-detail-loading-side">
          <div className="route-loading-bone league-detail-loading-card league-detail-loading-card--wide" />
          <div className="route-loading-bone league-detail-loading-card" />
          <div className="route-loading-bone league-detail-loading-card" />
        </div>
      </div>
    </div>
  );
}
