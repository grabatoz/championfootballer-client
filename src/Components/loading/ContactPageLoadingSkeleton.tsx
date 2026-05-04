export default function ContactPageLoadingSkeleton() {
  return (
    <div className="contact-page-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone contact-page-loading-card">
        <div className="route-loading-bone contact-page-loading-title" />
        <div className="route-loading-bone contact-page-loading-subtitle" />

        <div className="contact-page-loading-input-row">
          <div className="route-loading-bone contact-page-loading-input" />
          <div className="route-loading-bone contact-page-loading-input" />
        </div>

        <div className="route-loading-bone contact-page-loading-input" />
        <div className="route-loading-bone contact-page-loading-textarea" />
        <div className="route-loading-bone contact-page-loading-button" />
      </div>
    </div>
  );
}
