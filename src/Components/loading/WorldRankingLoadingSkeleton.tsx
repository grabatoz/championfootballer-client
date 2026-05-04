export default function WorldRankingLoadingSkeleton() {
  return (
    <div className="world-ranking-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone world-ranking-loading-title" />

      <div className="route-loading-bone world-ranking-loading-segment" />

      <div className="world-ranking-loading-filters">
        <div className="route-loading-bone world-ranking-loading-filter" />
        <div className="route-loading-bone world-ranking-loading-filter" />
        <div className="route-loading-bone world-ranking-loading-filter" />
        <div className="route-loading-bone world-ranking-loading-filter" />
      </div>

      <div className="route-loading-bone world-ranking-loading-info" />
      <div className="world-ranking-loading-summary">
        <div className="route-loading-bone world-ranking-loading-summary-item" />
        <div className="route-loading-bone world-ranking-loading-summary-item" />
        <div className="route-loading-bone world-ranking-loading-summary-item" />
      </div>

      <div className="world-ranking-loading-table">
        <div className="route-loading-bone world-ranking-loading-table-head" />
        <div className="route-loading-bone world-ranking-loading-row" />
        <div className="route-loading-bone world-ranking-loading-row" />
        <div className="route-loading-bone world-ranking-loading-row" />
        <div className="route-loading-bone world-ranking-loading-row" />
        <div className="route-loading-bone world-ranking-loading-row" />
        <div className="route-loading-bone world-ranking-loading-row" />
      </div>
    </div>
  );
}
