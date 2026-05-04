export default function PlayerCareerLoadingSkeleton() {
  return (
    <div className="player-career-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone player-career-loading-header" />
      <div className="route-loading-bone player-career-loading-filters" />
      <div className="player-career-loading-chips">
        <div className="route-loading-bone player-career-loading-chip" />
        <div className="route-loading-bone player-career-loading-chip" />
        <div className="route-loading-bone player-career-loading-chip" />
      </div>

      <div className="player-career-loading-main">
        <div className="route-loading-bone player-career-loading-chart" />
        <div className="route-loading-bone player-career-loading-chart" />
        <div className="route-loading-bone player-career-loading-panel" />
      </div>
    </div>
  );
}
