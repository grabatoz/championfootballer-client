type AllMatchesLoadingSkeletonProps = {
  compact?: boolean;
};

export default function AllMatchesLoadingSkeleton({ compact = false }: AllMatchesLoadingSkeletonProps) {
  return (
    <div
      className={`all-matches-loading-shell${compact ? ' all-matches-loading-shell--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-bone all-matches-loading-head" />

      <div className="all-matches-loading-toolbar">
        <div className="route-loading-bone all-matches-loading-chip all-matches-loading-chip--selector" />
        <div className="route-loading-bone all-matches-loading-chip" />
        <div className="route-loading-bone all-matches-loading-chip" />
        <div className="route-loading-bone all-matches-loading-chip" />
      </div>

      <div className="all-matches-loading-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="route-loading-bone all-matches-loading-card">
            <div className="route-loading-bone all-matches-loading-card-top" />
            <div className="all-matches-loading-card-score">
              <div className="route-loading-bone all-matches-loading-team-badge" />
              <div className="all-matches-loading-score-center">
                <div className="route-loading-bone all-matches-loading-card-team" />
                <div className="route-loading-bone all-matches-loading-card-team all-matches-loading-card-team--short" />
              </div>
              <div className="route-loading-bone all-matches-loading-team-badge" />
            </div>
            <div className="all-matches-loading-card-meta-wrap">
              <div className="route-loading-bone all-matches-loading-card-meta" />
              <div className="route-loading-bone all-matches-loading-card-meta all-matches-loading-card-meta--short" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
