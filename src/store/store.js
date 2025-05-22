import { configureStore } from '@reduxjs/toolkit'
import insightsReducer from 'src/store/slices/housing/insightsSlice'
import sitesReducer from 'src/store/slices/housing/sitesSlice'
import sitesAnalyticsReducer from 'src/store/slices/housing/sitesAnalyticsSlice'
import sectionReducer from 'src/store/slices/housing/sectionSlice'
import notesReducer from 'src/store/slices/housing/notesSlice'

const store = configureStore({
  reducer: {
    insights: insightsReducer,
    sites: sitesReducer,
    siteAnalytics: sitesAnalyticsReducer,
    section: sectionReducer,
    notes: notesReducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export default store
