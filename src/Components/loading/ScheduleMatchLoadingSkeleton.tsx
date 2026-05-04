type ScheduleMatchLoadingSkeletonProps = {
  mode?: 'page' | 'compact';
};

export default function ScheduleMatchLoadingSkeleton({ mode = 'page' }: ScheduleMatchLoadingSkeletonProps) {
  const isCompact = mode === 'compact';

  return (
    <div
      className={`schedule-match-loading-shell${isCompact ? ' schedule-match-loading-shell--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-bone schedule-match-loading-header" />
      <div className="route-loading-bone schedule-match-loading-subhead" />

      <div className="schedule-match-loading-main">
        <div className="route-loading-bone schedule-match-loading-calendar" />

        <div className="schedule-match-loading-form">
          <div className="route-loading-bone schedule-match-loading-input schedule-match-loading-input--sm" />
          <div className="route-loading-bone schedule-match-loading-input" />
          <div className="route-loading-bone schedule-match-loading-input" />
          <div className="route-loading-bone schedule-match-loading-input" />
          <div className="route-loading-bone schedule-match-loading-input" />
          <div className="route-loading-bone schedule-match-loading-input schedule-match-loading-input--lg" />
          <div className="route-loading-bone schedule-match-loading-action" />
        </div>
      </div>
    </div>
  );
}
