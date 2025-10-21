# Close Button Component - Usage Guide

## Overview
Yeh reusable Close Button (X) component hai jo har page par use kar sakte hain. Yeh automatically user ko previous page par bhej deta hai.

## Features
✅ Smart Navigation: Pehle browser history check karta hai
✅ Referrer fallback: Agar direct open kiya hai to referrer se back jata hai  
✅ Custom fallback: Agar kuch nahi mila to aap custom route provide kar sakte hain
✅ Responsive: Har screen size par sahi dikhta hai
✅ Hover effect: Hover par background change hota hai

## Installation
Component already created hai: `src/Components/CloseButton.tsx`

## Basic Usage

### 1. Simple Usage (default fallback to /dashboard)
```tsx
import CloseButton from '@/Components/CloseButton';

export default function MyPage() {
  return (
    <Box>
      <CloseButton />
      {/* Your page content */}
    </Box>
  );
}
```

### 2. Custom Fallback Route
```tsx
import CloseButton from '@/Components/CloseButton';

export default function PlayerPage() {
  return (
    <Box>
      <CloseButton fallbackRoute="/all-players" />
      {/* Your page content */}
    </Box>
  );
}
```

### 3. Dynamic Fallback Route
```tsx
import CloseButton from '@/Components/CloseButton';

export default function MatchPage({ matchId, leagueId }) {
  return (
    <Box>
      <CloseButton fallbackRoute={leagueId ? `/league/${leagueId}` : '/all-matches'} />
      {/* Your page content */}
    </Box>
  );
}
```

## Example Implementations for Different Pages

### Player Detail Page
```tsx
// src/app/player/[id]/_components/page.tsx
import CloseButton from '@/Components/CloseButton';

export default function PlayerDetailPage() {
  return (
    <Box sx={{ p: 4 }}>
      <CloseButton fallbackRoute="/all-players" />
      {/* Player content */}
    </Box>
  );
}
```

### League Detail Page
```tsx
// src/app/league/[id]/_components/page.tsx
import CloseButton from '@/Components/CloseButton';

export default function LeagueDetailPage() {
  return (
    <Box sx={{ p: 4 }}>
      <CloseButton fallbackRoute="/all-leagues" />
      {/* League content */}
    </Box>
  );
}
```

### Match Detail Page (Already Implemented)
```tsx
// src/app/match/[matchId]/_components/index.tsx
import CloseButton from '@/Components/CloseButton';

export default function MatchDetailsPage() {
  const match = useMatch(); // your hook
  
  return (
    <Box sx={{ p: { xs: 1, sm: 4 } }}>
      <CloseButton fallbackRoute={match?.leagueId ? `/league/${match.leagueId}` : '/all-matches'} />
      {/* Match content */}
    </Box>
  );
}
```

### Profile Page
```tsx
// src/app/profile/page.tsx
import CloseButton from '@/Components/CloseButton';

export default function ProfilePage() {
  return (
    <Box sx={{ p: 4 }}>
      <CloseButton fallbackRoute="/dashboard" />
      {/* Profile content */}
    </Box>
  );
}
```

### Trophy Room Page
```tsx
// src/app/trophy-room/page.tsx
import CloseButton from '@/Components/CloseButton';

export default function TrophyRoomPage() {
  return (
    <Box sx={{ p: 4 }}>
      <CloseButton fallbackRoute="/dashboard" />
      {/* Trophy room content */}
    </Box>
  );
}
```

### Leader Board Page
```tsx
// src/app/leader-board/page.tsx
import CloseButton from '@/Components/CloseButton';

export default function LeaderBoardPage() {
  return (
    <Box sx={{ p: 4 }}>
      <CloseButton fallbackRoute="/dashboard" />
      {/* Leader board content */}
    </Box>
  );
}
```

## Custom Styling

Agar aap styling customize karna chahte hain:

```tsx
import CloseButton from '@/Components/CloseButton';

<Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
  <CloseButton fallbackRoute="/dashboard" />
</Box>
```

## Navigation Logic Flow

1. **Browser History Check**
   - Agar browser history hai (length > 1), to `router.back()` call hota hai
   
2. **Referrer Check**
   - Agar direct URL open kiya hai, to `document.referrer` check hota hai
   - Agar referrer same origin se hai, to wahan bhej deta hai
   
3. **Fallback Route**
   - Agar kuch bhi nahi mila, to provided `fallbackRoute` use hota hai
   - Default fallback: `/dashboard`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fallbackRoute` | `string` | `'/dashboard'` | Jab koi history/referrer nahi milta to yeh route use hota hai |

## Tips

✅ **Har detail page par use karo** (player, match, league, etc.)
✅ **Fallback route page ke context ke according set karo**
✅ **Modal dialogs mein mat lagao** (wahan onClose use karo)
✅ **Top-right corner mein rakhna best hai** (consistent UX)

## Complete Example with All Features

```tsx
"use client";

import { Box, Typography } from '@mui/material';
import CloseButton from '@/Components/CloseButton';

export default function DetailPage() {
  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 4 }, 
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* Close button - top right */}
      <CloseButton fallbackRoute="/dashboard" />
      
      {/* Page content */}
      <Typography variant="h4">Page Title</Typography>
      {/* ... rest of your content */}
    </Box>
  );
}
```

## Troubleshooting

**Q: Button nahi dikh raha?**
A: Check karo ke `color: '#fff'` set hai. Dark background par white color use karo.

**Q: Click karne par kuch nahi ho raha?**
A: Console check karo errors ke liye. Make sure `useRouter` properly import hui hai.

**Q: Wrong page par ja raha hai?**
A: `fallbackRoute` prop check karo aur context ke according set karo.
