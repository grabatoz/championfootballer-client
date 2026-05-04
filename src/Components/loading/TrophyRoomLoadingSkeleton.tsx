export default function TrophyRoomLoadingSkeleton() {
  return (
    <div className="trophy-room-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone trophy-room-loading-header" />
      <div className="route-loading-bone trophy-room-loading-league" />

      <div className="trophy-room-loading-toolbar">
        <div className="route-loading-bone trophy-room-loading-chip" />
        <div className="route-loading-bone trophy-room-loading-chip" />
        <div className="route-loading-bone trophy-room-loading-chip" />
      </div>

      <div className="trophy-room-loading-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="route-loading-bone trophy-room-loading-card">
            <div className="route-loading-bone trophy-room-loading-icon" />
            <div className="route-loading-bone trophy-room-loading-title" />
            <div className="route-loading-bone trophy-room-loading-sub" />
          </div>
        ))}
      </div>
    </div>
  );
}
