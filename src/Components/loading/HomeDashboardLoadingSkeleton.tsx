import dash from '@/Components/images/bgpage.png';

export default function HomeDashboardLoadingSkeleton() {
  return (
    <div className="home-dashboard-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div
        className="home-dashboard-loading-surface"
        style={{ backgroundImage: `url(${dash.src})` }}
      >
        <section className="home-dashboard-loading-stats">
          <div className="home-dashboard-loading-bone home-dashboard-loading-stats-title" />
          <div className="home-dashboard-loading-stats-row">
            <div className="home-dashboard-loading-bone home-dashboard-loading-stat-pill" />
            <div className="home-dashboard-loading-bone home-dashboard-loading-stat-pill" />
            <div className="home-dashboard-loading-bone home-dashboard-loading-stat-pill" />
          </div>
          <div className="home-dashboard-loading-stats-row">
            <div className="home-dashboard-loading-bone home-dashboard-loading-stat-pill home-dashboard-loading-stat-pill--wide" />
            <div className="home-dashboard-loading-bone home-dashboard-loading-stat-pill" />
          </div>
        </section>

        <section className="home-dashboard-loading-main">
          <div className="home-dashboard-loading-player-card">
            <div className="home-dashboard-loading-bone home-dashboard-loading-player-avatar" />
            <div className="home-dashboard-loading-bone home-dashboard-loading-player-name" />
            <div className="home-dashboard-loading-bone home-dashboard-loading-player-number" />
            <div className="home-dashboard-loading-player-core">
              <div className="home-dashboard-loading-bone home-dashboard-loading-player-core-line" />
              <div className="home-dashboard-loading-player-core-body">
                <div className="home-dashboard-loading-bone home-dashboard-loading-player-core-figure" />
              </div>
              <div className="home-dashboard-loading-bone home-dashboard-loading-player-core-line home-dashboard-loading-player-core-line--short" />
            </div>
            <div className="home-dashboard-loading-player-metrics">
              <div className="home-dashboard-loading-bone home-dashboard-loading-player-metric" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-player-metric" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-player-metric" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-player-metric" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-player-metric" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-player-metric" />
            </div>
          </div>

          <div className="home-dashboard-loading-right">
            <div className="home-dashboard-loading-panel">
              <div className="home-dashboard-loading-bone home-dashboard-loading-welcome-line" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-welcome-line home-dashboard-loading-welcome-line--short" />
              <div className="home-dashboard-loading-divider" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-caption" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-league-select" />
              <div className="home-dashboard-loading-bone home-dashboard-loading-button home-dashboard-loading-button--create" />
              <div className="home-dashboard-loading-join-row">
                <div className="home-dashboard-loading-bone home-dashboard-loading-join-input" />
                <div className="home-dashboard-loading-bone home-dashboard-loading-join-button" />
              </div>
            </div>
            <div className="home-dashboard-loading-bone home-dashboard-loading-world-button" />
          </div>
        </section>
      </div>
    </div>
  );
}
