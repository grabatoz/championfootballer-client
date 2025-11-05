import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { LeaguesResponse } from '@/types/api';

export const leaguesApi = createApi({
  reducerPath: 'leaguesApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // Add auth token if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  // Enable caching and automatic refetching
  tagTypes: ['Leagues', 'Matches', 'Players'],
  // Keep unused data in cache for 60 seconds
  keepUnusedDataFor: 60,
  // Refetch on mount if data is older than 30 seconds
  refetchOnMountOrArgChange: 30,
  endpoints: (builder) => ({
    getLeagues: builder.query<LeaguesResponse, void>({
      query: () => 'leagues/user',
      providesTags: ['Leagues'],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { 
  useGetLeaguesQuery,
  useLazyGetLeaguesQuery,
  usePrefetch,
} = leaguesApi; 