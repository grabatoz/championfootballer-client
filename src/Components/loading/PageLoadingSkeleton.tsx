export default function PageLoadingSkeleton() {
  return (
    <div className="home-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="home-loading-topbar">
        <div className="home-loading-bone home-loading-logo" />
      </div>

      <div className="home-loading-divider" />

      <section className="home-loading-hero">
        <div className="home-loading-left">
          <div className="home-loading-bone home-loading-title home-loading-title--1" />
          <div className="home-loading-bone home-loading-title home-loading-title--2" />
          <div className="home-loading-bone home-loading-subtitle home-loading-subtitle--1" />
          <div className="home-loading-bone home-loading-subtitle home-loading-subtitle--2" />
          <div className="home-loading-bone home-loading-players" />
          <div className="home-loading-bone home-loading-tagline" />
        </div>

        <div className="home-loading-right">
          <div className="home-loading-bone home-loading-right-text" />
          <div className="home-loading-bone home-loading-join-btn" />

          <div className="home-loading-auth-card">
            <div className="home-loading-bone home-loading-auth-tab" />
            <div className="home-loading-bone home-loading-input" />
            <div className="home-loading-bone home-loading-input" />
            <div className="home-loading-bone home-loading-auth-btn" />
            <div className="home-loading-bone home-loading-social" />
          </div>
        </div>
      </section>

      <section className="home-loading-features">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="home-loading-feature-card">
            <div className="home-loading-bone home-loading-feature-title" />
            <div className="home-loading-bone home-loading-feature-image" />
          </div>
        ))}
      </section>

      <div className="home-loading-spacer" />
    </div>
  );
}
