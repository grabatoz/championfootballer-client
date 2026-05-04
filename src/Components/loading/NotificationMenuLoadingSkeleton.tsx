import { Box, Skeleton } from '@mui/material';

type NotificationMenuLoadingSkeletonProps = {
  rows?: number;
};

export default function NotificationMenuLoadingSkeleton({
  rows = 4,
}: NotificationMenuLoadingSkeletonProps) {
  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            position: 'relative',
            borderLeft: '4px solid #1976d2',
            borderRadius: 1.2,
            p: 1.25,
            background: 'linear-gradient(135deg,#f0f6ff 0%, #ffffff 60%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <Skeleton
              variant="circular"
              width={16}
              height={16}
              animation="wave"
              sx={{ bgcolor: 'rgba(0,0,0,0.08)' }}
            />
          </Box>

          <Skeleton
            variant="text"
            width={`${60 - (index % 2) * 8}%`}
            height={20}
            animation="wave"
            sx={{ mb: 0.2 }}
          />
          <Skeleton
            variant="text"
            width={`${88 - (index % 3) * 8}%`}
            height={18}
            animation="wave"
            sx={{ mb: 0.35 }}
          />
          <Skeleton
            variant="text"
            width={`${48 + (index % 2) * 10}%`}
            height={15}
            animation="wave"
            sx={{ mb: 1.1 }}
          />

          <Box sx={{ display: 'flex', gap: 0.8 }}>
            <Skeleton
              variant="rounded"
              width={94}
              height={28}
              animation="wave"
              sx={{ borderRadius: 999 }}
            />
            <Skeleton
              variant="rounded"
              width={94}
              height={28}
              animation="wave"
              sx={{ borderRadius: 999 }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
