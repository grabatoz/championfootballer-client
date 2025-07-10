'use client';
import TrophyRoom from '@/Components/TrophyRoom';
import { useParams } from 'next/navigation';

export default function TrophyRoomPage() {
    const params = useParams();
    const leagueId = params?.id ? String(params.id) : '';
    return <TrophyRoom leagueId={leagueId} />;
} 