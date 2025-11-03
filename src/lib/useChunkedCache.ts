// REACT HOOK FOR REAL-TIME CACHE UPDATES
import { useEffect, useState, useCallback, useRef } from 'react';
import { subscribeToCacheUpdates, invalidateCache } from './chunkCache';

// Hook for fetching data with real-time updates
export function useChunkedData<T extends { id: string }>(
  resource: string,
  fetchFn: (page: number) => Promise<T[]>,
  options: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    enabled?: boolean;
  } = {}
) {
  const { autoRefresh = false, refreshInterval = 30000, enabled = true } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isMounted = useRef(true);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  const loadPage = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!enabled) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const newData = await fetchFn(pageNum);
        
        if (!isMounted.current) return;
        
        if (newData.length === 0) {
          setHasMore(false);
        }
        
        setData((prev) => (append ? [...prev, ...newData] : newData));
        setPage(pageNum);
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error('Failed to load data'));
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [fetchFn, enabled]
  );

  // Load initial page
  useEffect(() => {
    isMounted.current = true;
    loadPage(0);
    
    return () => {
      isMounted.current = false;
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [loadPage]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !enabled) return;
    
    refreshTimer.current = setInterval(() => {
      loadPage(0);
    }, refreshInterval);
    
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [autoRefresh, refreshInterval, loadPage, enabled]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToCacheUpdates<T>(resource, (updatedItem) => {
      setData((prevData) => {
        // Check if item was deleted
        if ('_deleted' in updatedItem && updatedItem._deleted) {
          return prevData.filter((item) => item.id !== updatedItem.id);
        }
        
        // Check if item exists
        const index = prevData.findIndex((item) => item.id === updatedItem.id);
        
        if (index !== -1) {
          // Update existing item
          const newData = [...prevData];
          newData[index] = { ...newData[index], ...updatedItem };
          return newData;
        } else {
          // Add new item at the beginning
          return [updatedItem, ...prevData];
        }
      });
    });
    
    return unsubscribe;
  }, [resource]);

  // Load more data
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadPage(page + 1, true);
  }, [hasMore, loading, page, loadPage]);

  // Refresh data
  const refresh = useCallback(() => {
    invalidateCache(resource);
    loadPage(0);
  }, [resource, loadPage]);

  // Optimistic update
  const optimisticUpdate = useCallback((item: T) => {
    setData((prevData) => {
      const index = prevData.findIndex((i) => i.id === item.id);
      if (index !== -1) {
        const newData = [...prevData];
        newData[index] = item;
        return newData;
      }
      return [item, ...prevData];
    });
  }, []);

  // Optimistic add
  const optimisticAdd = useCallback((item: T) => {
    setData((prevData) => [item, ...prevData]);
  }, []);

  // Optimistic remove
  const optimisticRemove = useCallback((itemId: string) => {
    setData((prevData) => prevData.filter((item) => item.id !== itemId));
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    optimisticUpdate,
    optimisticAdd,
    optimisticRemove,
  };
}

// Hook for listening to cache events
export function useCacheEvent(
  eventType: string,
  callback: (detail: unknown) => void
) {
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    window.addEventListener(eventType, handler);
    
    return () => {
      window.removeEventListener(eventType, handler);
    };
  }, [eventType, callback]);
}

// Hook for monitoring cache changes
export function useCacheSubscription<T>(
  resource: string,
  callback: (data: T) => void
) {
  useEffect(() => {
    const unsubscribe = subscribeToCacheUpdates<T>(resource, callback);
    return unsubscribe;
  }, [resource, callback]);
}
