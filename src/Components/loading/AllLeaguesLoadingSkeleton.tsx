type AllLeaguesLoadingSkeletonProps = {
  compact?: boolean;
};

export default function AllLeaguesLoadingSkeleton({ compact = false }: AllLeaguesLoadingSkeletonProps) {
  return (
    <div
      className={`all-leagues-loading-shell${compact ? ' all-leagues-loading-shell--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-bone all-leagues-loading-head" />

      <div className="all-leagues-loading-toolbar">
        <div className="route-loading-bone all-leagues-loading-toolbar-chip all-leagues-loading-toolbar-chip--lg" />
        <div className="route-loading-bone all-leagues-loading-toolbar-chip" />
        <div className="route-loading-bone all-leagues-loading-toolbar-chip" />
      </div>

      <div className="route-loading-bone all-leagues-loading-section-title" />

      <div className="all-leagues-loading-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="route-loading-bone all-leagues-loading-card">
            <div className="all-leagues-loading-card-main">
              <div className="route-loading-bone all-leagues-loading-card-thumb" />
              <div className="all-leagues-loading-card-copy">
                <div className="route-loading-bone all-leagues-loading-card-title" />
                <div className="route-loading-bone all-leagues-loading-card-sub" />
                <div className="route-loading-bone all-leagues-loading-card-sub all-leagues-loading-card-sub--short" />
              </div>
            </div>
            <div className="all-leagues-loading-card-side">
              <div className="route-loading-bone all-leagues-loading-card-badge" />
              <div className="route-loading-bone all-leagues-loading-card-action" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
