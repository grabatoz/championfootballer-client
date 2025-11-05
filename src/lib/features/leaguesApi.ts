import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { LeaguesResponse } from '@/types/api';

export const leaguesApi = createApi({
  reducerPath: 'leaguesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getLeagues: builder.query<LeaguesResponse, void>({
      query: () => 'leagues/user',
    }),
  }),
});

export const { useGetLeaguesQuery } = leaguesApi; 