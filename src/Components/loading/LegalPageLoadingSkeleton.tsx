export default function LegalPageLoadingSkeleton() {
  return (
    <div className="legal-page-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone legal-page-loading-title" />
      <div className="legal-page-loading-tabs">
        <div className="route-loading-bone legal-page-loading-tab" />
        <div className="route-loading-bone legal-page-loading-tab" />
        <div className="route-loading-bone legal-page-loading-tab" />
      </div>

      <div className="route-loading-bone legal-page-loading-intro" />

      <div className="legal-page-loading-sections">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="route-loading-bone legal-page-loading-section" />
        ))}
      </div>
    </div>
  );
}
