type MatchResultLoadingSkeletonProps = {
  mode?: 'page' | 'dialog';
};

export default function MatchResultLoadingSkeleton({ mode = 'page' }: MatchResultLoadingSkeletonProps) {
  const isDialog = mode === 'dialog';

  return (
    <div
      className={`match-result-loading-shell${isDialog ? ' match-result-loading-shell--dialog' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-bone match-result-loading-title" />
      <div className="route-loading-bone match-result-loading-scoreboard" />

      <div className="match-result-loading-summary-row">
        <div className="route-loading-bone match-result-loading-summary-item" />
        <div className="route-loading-bone match-result-loading-summary-item" />
        <div className="route-loading-bone match-result-loading-summary-item" />
      </div>

      <div className="match-result-loading-panels">
        <div className="route-loading-bone match-result-loading-panel" />
        <div className="route-loading-bone match-result-loading-panel" />
      </div>
    </div>
  );
}
