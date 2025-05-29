import { configureStore } from '@reduxjs/toolkit'
import insightsReducer from 'src/store/slices/housing/insightsSlice'
import sitesReducer from 'src/store/slices/housing/sitesSlice'
import sitesAnalyticsReducer from 'src/store/slices/housing/sitesAnalyticsSlice'
import sectionReducer from 'src/store/slices/housing/sectionSlice'
import notesReducer from 'src/store/slices/housing/notesSlice'
import speciesReducer from 'src/store/slices/housing/speciesSlice'
import mortalityReducer from 'src/store/slices/housing/mortalitySlice'
import animalTreatmentReducer from 'src/store/slices/housing/animalTreatmentSlice'
import mediaReducer from 'src/store/slices/housing/mediaSlice'
import sectionInfiniteScrollReducer from 'src/store/slices/housing/sectionInfiniteScrollSlice'
import speciesInfiniteScrollReducer from 'src/store/slices/housing/speciesInfiniteScrollSlice'

const store = configureStore({
  reducer: {
    insights: insightsReducer,
    sites: sitesReducer,
    siteAnalytics: sitesAnalyticsReducer,
    section: sectionReducer,
    notes: notesReducer,
    species: speciesReducer,
    mortality: mortalityReducer,
    animalTreatment: animalTreatmentReducer,
    media: mediaReducer,
    sectionInfiniteScroll: sectionInfiniteScrollReducer,
    speciesInfiniteScroll: speciesInfiniteScrollReducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export default store
