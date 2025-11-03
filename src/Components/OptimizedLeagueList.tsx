// EXAMPLE: Real-time League List with Chunk Caching
'use client';

import React, { useCallback, useRef } from 'react';
import { leagueAPI } from '@/lib/api-chunked';
import { useChunkedData, useCacheEvent } from '@/lib/useChunkedCache';
import type { LeagueApi } from '@/types/api';
import { toast } from 'react-hot-toast';

export default function OptimizedLeagueList() {
  const {
    data: leagues,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = useChunkedData<LeagueApi>(
    'leagues',
    async (page) => {
      const response = await leagueAPI.getAll(page, 20);
      return response.leagues || [];
    },
    {
      autoRefresh: true,
      refreshInterval: 30000, // Auto-refresh every 30 seconds
    }
  );

  // Listen to real-time league events
  useCacheEvent('league-created', (detail) => {
    const data = detail as { league: LeagueApi };
    console.log('🎉 New league created:', data.league.name);
    toast.success(`League "${data.league.name}" created!`);
  });

  useCacheEvent('league-joined', (detail) => {
    const data = detail as { leagueId: string };
    console.log('✅ Joined league:', data.leagueId);
    toast.success('Successfully joined league!');
  });

  useCacheEvent('league-left', (detail) => {
    const data = detail as { leagueId: string };
    console.log('👋 Left league:', data.leagueId);
    toast('You left the league');
  });

  useCacheEvent('league-deleted', (detail) => {
    const data = detail as { leagueId: string };
    console.log('🗑️ League deleted:', data.leagueId);
    toast('League has been deleted');
  });

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastLeagueRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          console.log('📜 Loading more leagues...');
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  // Join league with optimistic update
  const handleJoinLeague = async (leagueId: string) => {
    try {
      // Find the league
      const league = leagues.find((l) => l.id === leagueId);
      if (!league) return;

      // Optimistic update - update UI immediately
      toast.loading('Joining league...', { id: 'join-league' });

      // Make API call
      const result = await leagueAPI.join(leagueId);

      if (result.success) {
        toast.success('Joined league successfully!', { id: 'join-league' });
        // Cache automatically updated via event system
      } else {
        throw new Error(result.message || 'Failed to join league');
      }
    } catch (err) {
      console.error('Failed to join league:', err);
      toast.error('Failed to join league', { id: 'join-league' });
      // Refresh to get correct state from server
      refresh();
    }
  };

  // Leave league with optimistic update
  const handleLeaveLeague = async (leagueId: string) => {
    try {
      toast.loading('Leaving league...', { id: 'leave-league' });

      const result = await leagueAPI.leave(leagueId);

      if (result.success) {
        toast.success('Left league successfully!', { id: 'leave-league' });
        // Cache automatically updated via event system
      } else {
        throw new Error(result.message || 'Failed to leave league');
      }
    } catch (err) {
      console.error('Failed to leave league:', err);
      toast.error('Failed to leave league', { id: 'leave-league' });
      refresh();
    }
  };

  // Delete league with optimistic remove
  const handleDeleteLeague = async (leagueId: string) => {
    try {
      // Optimistically remove from UI
      optimisticRemove(leagueId);
      toast.loading('Deleting league...', { id: 'delete-league' });

      const result = await leagueAPI.delete(leagueId);

      if (result.success) {
        toast.success('League deleted successfully!', { id: 'delete-league' });
      } else {
        throw new Error(result.message || 'Failed to delete league');
      }
    } catch (err) {
      console.error('Failed to delete league:', err);
      toast.error('Failed to delete league', { id: 'delete-league' });
      // Revert optimistic update
      refresh();
    }
  };

  // Create league with optimistic add
  const handleCreateLeague = async (leagueData: {
    name: string;
    description: string;
  }) => {
    try {
      toast.loading('Creating league...', { id: 'create-league' });

      const result = await leagueAPI.create(leagueData);

      if (result.success) {
        // Cache automatically updated via addCachedItem in api-chunked
        toast.success('League created successfully!', { id: 'create-league' });
        // Refresh to get the latest data with proper types
        refresh();
      } else {
        throw new Error(result.message || 'Failed to create league');
      }
    } catch (err) {
      console.error('Failed to create league:', err);
      toast.error('Failed to create league', { id: 'create-league' });
      refresh();
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">Error loading leagues: {error.message}</p>
        <button
          onClick={refresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Leagues {leagues.length > 0 && `(${leagues.length})`}
        </h2>
        <div className="space-x-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => {
              const name = prompt('League name:');
              const description = prompt('League description:');
              if (name && description) {
                handleCreateLeague({ name, description });
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create League
          </button>
        </div>
      </div>

      {loading && leagues.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leagues...</p>
        </div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded">
          <p className="text-gray-600">No leagues found</p>
          <button
            onClick={() => {
              const name = prompt('League name:');
              const description = prompt('League description:');
              if (name && description) {
                handleCreateLeague({ name, description });
              }
            }}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First League
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league, index) => (
              <div
                key={league.id}
                ref={index === leagues.length - 1 ? lastLeagueRef : null}
                className="p-4 bg-white border rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">{league.name}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {league.description || 'No description'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleJoinLeague(league.id)}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => handleLeaveLeague(league.id)}
                    className="flex-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Leave
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this league?')) {
                        handleDeleteLeague(league.id);
                      }
                    }}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {/* Loading indicator at bottom */}
          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </>
      )}

      {/* Cache info (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded text-xs">
          <p className="font-mono">
            ⚡ Cached: {leagues.length} leagues | Has more: {hasMore ? 'Yes' : 'No'} |
            Loading: {loading ? 'Yes' : 'No'}
          </p>
        </div>
      )}
    </div>
  );
}
