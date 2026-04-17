import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getSiteAnalytics } from 'src/lib/api/housing'
import type { SectionAnalytics, InsightsState } from 'src/types/housing'

// Async thunk to fetch insights with params
export const fetchInsights = createAsyncThunk<
  SectionAnalytics,
  number,
  { rejectValue: string }
>('zoo/home', async (id, { rejectWithValue }) => {
  try {
    const response = await getSiteAnalytics(id)

    return response.data as SectionAnalytics
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch insights')
  }
})

const initialState: InsightsState = {
  data: null,
  loading: false,
  error: null
}

const insightsSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    clearInsights: state => {
      state.data = null
      state.loading = false
      state.error = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchInsights.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInsights.fulfilled, (state, action: PayloadAction<SectionAnalytics>) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { clearInsights } = insightsSlice.actions

export default insightsSlice.reducer
