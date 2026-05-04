type EditMatchPopupLoadingSkeletonProps = {
  mode?: 'dialog' | 'page';
};

export default function EditMatchPopupLoadingSkeleton({ mode = 'dialog' }: EditMatchPopupLoadingSkeletonProps) {
  const isPage = mode === 'page';

  return (
    <div
      className={`edit-match-popup-loading-shell${isPage ? ' edit-match-popup-loading-shell--page' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-bone edit-match-popup-loading-header" />

      <div className="edit-match-popup-loading-main">
        <div className="edit-match-popup-loading-panel">
          <div className="route-loading-bone edit-match-popup-loading-input" />
          <div className="route-loading-bone edit-match-popup-loading-input" />
          <div className="route-loading-bone edit-match-popup-loading-input" />
          <div className="route-loading-bone edit-match-popup-loading-input" />
          <div className="route-loading-bone edit-match-popup-loading-input edit-match-popup-loading-input--lg" />
        </div>

        <div className="edit-match-popup-loading-panel">
          <div className="route-loading-bone edit-match-popup-loading-team-row" />
          <div className="route-loading-bone edit-match-popup-loading-team-row" />
          <div className="route-loading-bone edit-match-popup-loading-team-row" />
          <div className="route-loading-bone edit-match-popup-loading-team-row" />
          <div className="route-loading-bone edit-match-popup-loading-team-row" />
        </div>
      </div>

      <div className="route-loading-bone edit-match-popup-loading-action" />
    </div>
  );
}
