import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getSpecificSiteAnalytics } from 'src/lib/api/housing'
import type { SiteAnalytics, SiteAnalyticsState } from 'src/types/housing'

interface FetchSiteParams {
  site_id: number
}

// Async thunk to fetch insights with params
export const fetchSite = createAsyncThunk<
  SiteAnalytics,
  FetchSiteParams,
  { rejectValue: string }
>('site-details', async (params, { rejectWithValue }) => {
  try {
    const response = await getSpecificSiteAnalytics(params)

    return response.data as SiteAnalytics
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch site')
  }
})

const initialState: SiteAnalyticsState = {
  data: null,
  loading: false,
  error: null
}

const sitesAnalyticsSlice = createSlice({
  name: 'siteAnalytics',
  initialState,
  reducers: {
    clearSiteAnalytics: state => {
      state.data = null
      state.loading = false
      state.error = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSite.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSite.fulfilled, (state, action: PayloadAction<SiteAnalytics>) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchSite.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { clearSiteAnalytics } = sitesAnalyticsSlice.actions

export default sitesAnalyticsSlice.reducer
