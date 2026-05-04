type LeaderBoardLoadingSkeletonProps = {
  compact?: boolean;
};

export default function LeaderBoardLoadingSkeleton({ compact = false }: LeaderBoardLoadingSkeletonProps) {
  return (
    <div
      className={`leader-board-loading-shell${compact ? ' leader-board-loading-shell--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="leader-board-loading-top">
        <div className="route-loading-bone leader-board-loading-title" />
        <div className="route-loading-bone leader-board-loading-select" />
      </div>

      <div className="leader-board-loading-metrics">
        <div className="route-loading-bone leader-board-loading-metric" />
        <div className="route-loading-bone leader-board-loading-metric" />
        <div className="route-loading-bone leader-board-loading-metric" />
        <div className="route-loading-bone leader-board-loading-metric" />
        <div className="route-loading-bone leader-board-loading-metric" />
      </div>

      <div className="leader-board-loading-podium">
        <div className="route-loading-bone leader-board-loading-podium-card" />
        <div className="route-loading-bone leader-board-loading-podium-card leader-board-loading-podium-card--tall" />
        <div className="route-loading-bone leader-board-loading-podium-card" />
      </div>

      <div className="leader-board-loading-list">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="route-loading-bone leader-board-loading-card">
            <div className="route-loading-bone leader-board-loading-rank" />
            <div className="route-loading-bone leader-board-loading-avatar" />
            <div className="leader-board-loading-card-lines">
              <div className="route-loading-bone leader-board-loading-line" />
              <div className="route-loading-bone leader-board-loading-line leader-board-loading-line--sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
