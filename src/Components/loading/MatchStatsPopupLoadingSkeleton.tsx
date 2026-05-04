type MatchStatsPopupLoadingSkeletonProps = {
  mode?: 'stats' | 'score';
};

export default function MatchStatsPopupLoadingSkeleton({ mode = 'stats' }: MatchStatsPopupLoadingSkeletonProps) {
  const isScore = mode === 'score';

  return (
    <div
      className={`match-popup-loading-shell${isScore ? ' match-popup-loading-shell--score' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-bone match-popup-loading-header" />

      <div className="match-popup-loading-rows">
        <div className="route-loading-bone match-popup-loading-row" />
        <div className="route-loading-bone match-popup-loading-row" />
      </div>

      {!isScore && (
        <div className="match-popup-loading-team-grid">
          <div className="route-loading-bone match-popup-loading-team-card" />
          <div className="route-loading-bone match-popup-loading-team-card" />
        </div>
      )}

      {isScore && (
        <div className="match-popup-loading-score-row">
          <div className="route-loading-bone match-popup-loading-score-box" />
          <div className="route-loading-bone match-popup-loading-score-sep" />
          <div className="route-loading-bone match-popup-loading-score-box" />
        </div>
      )}

      <div className="route-loading-bone match-popup-loading-actions" />
    </div>
  );
}
