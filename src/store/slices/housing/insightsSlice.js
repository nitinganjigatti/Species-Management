import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getSiteAnalytics } from 'src/lib/api/housing'

// Async thunk to fetch insights with params
export const fetchInsights = createAsyncThunk('zoo/home', async (id, { rejectWithValue }) => {
  try {
    const response = await getSiteAnalytics(id)

    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch insights')
  }
})

const insightsSlice = createSlice({
  name: 'insights',
  initialState: {
    data: null,
    loading: false,
    error: null
  },
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
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { clearInsights } = insightsSlice.actions

export default insightsSlice.reducer
