export default function ViewTeamPopupLoadingSkeleton() {
  return (
    <div className="view-team-popup-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="view-team-popup-loading-top">
        <div className="route-loading-bone view-team-popup-loading-title" />
        <div className="route-loading-bone view-team-popup-loading-toggle" />
      </div>

      <div className="route-loading-bone view-team-popup-loading-pitch" />

      <div className="view-team-popup-loading-lists">
        <div className="route-loading-bone view-team-popup-loading-list" />
        <div className="route-loading-bone view-team-popup-loading-list" />
      </div>
    </div>
  );
}
