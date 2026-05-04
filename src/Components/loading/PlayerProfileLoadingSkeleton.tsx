export default function PlayerProfileLoadingSkeleton() {
  return (
    <div className="player-profile-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone player-profile-loading-header" />
      <div className="route-loading-bone player-profile-loading-filter" />

      <div className="player-profile-loading-overview">
        <div className="route-loading-bone player-profile-loading-panel player-profile-loading-panel--hero">
          <div className="player-profile-loading-top">
            <div className="route-loading-bone player-profile-loading-avatar" />
            <div className="player-profile-loading-top-text">
              <div className="route-loading-bone player-profile-loading-name" />
              <div className="route-loading-bone player-profile-loading-sub" />
              <div className="route-loading-bone player-profile-loading-sub player-profile-loading-sub--long" />
            </div>
          </div>

          <div className="player-profile-loading-cards">
            <div className="route-loading-bone player-profile-loading-card" />
            <div className="route-loading-bone player-profile-loading-card" />
            <div className="route-loading-bone player-profile-loading-card" />
          </div>
        </div>

        <div className="route-loading-bone player-profile-loading-panel player-profile-loading-panel--side">
          <div className="route-loading-bone player-profile-loading-side-title" />
          <div className="route-loading-bone player-profile-loading-side-line" />
          <div className="route-loading-bone player-profile-loading-side-line" />
          <div className="route-loading-bone player-profile-loading-side-line" />
        </div>
      </div>

      <div className="route-loading-bone player-profile-loading-table" />
    </div>
  );
}
