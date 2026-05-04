export default function RewardsLoadingSkeleton() {
  return (
    <div className="rewards-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone rewards-loading-header" />

      <div className="route-loading-bone rewards-loading-hero" />

      <div className="rewards-loading-metrics">
        <div className="route-loading-bone rewards-loading-metric" />
        <div className="route-loading-bone rewards-loading-metric" />
        <div className="route-loading-bone rewards-loading-metric" />
      </div>

      <div className="rewards-loading-grid">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="route-loading-bone rewards-loading-card">
            <div className="route-loading-bone rewards-loading-card-title" />
            <div className="route-loading-bone rewards-loading-card-image" />
            <div className="route-loading-bone rewards-loading-card-sub" />
            <div className="route-loading-bone rewards-loading-card-footer" />
          </div>
        ))}
      </div>
    </div>
  );
}
