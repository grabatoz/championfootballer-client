export default function ProfileSettingsLoadingSkeleton() {
  return (
    <div className="profile-settings-loading-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-bone profile-settings-loading-stepper" />
      <div className="route-loading-bone profile-settings-loading-tabs" />

      <div className="profile-settings-loading-top">
        <div className="route-loading-bone profile-settings-loading-avatar" />
        <div className="profile-settings-loading-top-text">
          <div className="route-loading-bone profile-settings-loading-name" />
          <div className="route-loading-bone profile-settings-loading-line" />
          <div className="route-loading-bone profile-settings-loading-line" />
          <div className="route-loading-bone profile-settings-loading-line" />
        </div>
      </div>

      <div className="profile-settings-loading-form-grid">
        <div className="route-loading-bone profile-settings-loading-input" />
        <div className="route-loading-bone profile-settings-loading-input" />
        <div className="route-loading-bone profile-settings-loading-input" />
        <div className="route-loading-bone profile-settings-loading-input" />
        <div className="route-loading-bone profile-settings-loading-input" />
        <div className="route-loading-bone profile-settings-loading-input" />
      </div>

      <div className="profile-settings-loading-grid">
        <div className="route-loading-bone profile-settings-loading-card" />
        <div className="route-loading-bone profile-settings-loading-card" />
      </div>

      <div className="route-loading-bone profile-settings-loading-actions" />
    </div>
  );
}
