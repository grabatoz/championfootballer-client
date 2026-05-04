type AllPlayersLoadingSkeletonProps = {
  compact?: boolean;
};

export default function AllPlayersLoadingSkeleton({ compact = false }: AllPlayersLoadingSkeletonProps) {
  return (
    <div
      className={`all-players-loading-shell${compact ? ' all-players-loading-shell--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-bone all-players-loading-header" />

      <div className="all-players-loading-toolbar">
        <div className="route-loading-bone all-players-loading-toolbar-item all-players-loading-toolbar-item--wide" />
        <div className="route-loading-bone all-players-loading-toolbar-item" />
        <div className="route-loading-bone all-players-loading-toolbar-item" />
      </div>

      <div className="route-loading-bone all-players-loading-table-head" />

      <div className="all-players-loading-rows">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="route-loading-bone all-players-loading-row">
            <div className="all-players-loading-player">
              <div className="route-loading-bone all-players-loading-avatar" />
              <div className="all-players-loading-player-copy">
                <div className="route-loading-bone all-players-loading-name" />
                <div className="route-loading-bone all-players-loading-name all-players-loading-name--sub" />
              </div>
            </div>
            <div className="route-loading-bone all-players-loading-stats" />
            <div className="route-loading-bone all-players-loading-stats" />
            <div className="route-loading-bone all-players-loading-stats all-players-loading-stats--short" />
          </div>
        ))}
      </div>
    </div>
  );
}
