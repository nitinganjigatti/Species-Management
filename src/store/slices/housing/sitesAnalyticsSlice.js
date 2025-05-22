import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getSpecificSiteAnalytics } from 'src/lib/api/housing'

// Async thunk to fetch insights with params
export const fetchSite = createAsyncThunk('site-details', async (params, { rejectWithValue }) => {
  try {
    debugger
    const response = await getSpecificSiteAnalytics(params) 

    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch site')
  }
})

const sitesAnalyticsSlice = createSlice({
  name: 'siteAnalytics',
  initialState: {
    data: null,
    loading: false,
    error: null
  },
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
      .addCase(fetchSite.fulfilled, (state, action) => { 
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchSite.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { clearSiteAnalytics } = sitesAnalyticsSlice.actions

export default sitesAnalyticsSlice.reducer
