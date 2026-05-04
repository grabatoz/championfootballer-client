type DreamTeamLoadingSkeletonProps = {
  compact?: boolean;
};

export default function DreamTeamLoadingSkeleton({ compact = false }: DreamTeamLoadingSkeletonProps) {
  return (
    <div
      className={`dream-team-loading-shell${compact ? ' dream-team-loading-shell--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="dream-team-loading-toolbar">
        <div className="route-loading-bone dream-team-loading-heading" />
        <div className="route-loading-bone dream-team-loading-select" />
      </div>

      <div className="dream-team-loading-filters">
        <div className="route-loading-bone dream-team-loading-filter" />
        <div className="route-loading-bone dream-team-loading-filter" />
        <div className="route-loading-bone dream-team-loading-filter" />
      </div>

      <div className="route-loading-bone dream-team-loading-pitch" />

      <div className="route-loading-bone dream-team-loading-panel">
        <div className="route-loading-bone dream-team-loading-panel-title" />
        <div className="dream-team-loading-list">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="route-loading-bone dream-team-loading-list-row" />
          ))}
        </div>
      </div>
    </div>
  );
}
