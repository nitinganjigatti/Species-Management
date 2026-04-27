import { configureStore } from '@reduxjs/toolkit'
import insightsReducer from 'src/store/slices/housing/insightsSlice'
import sitesAnalyticsReducer from 'src/store/slices/housing/sitesAnalyticsSlice'
import sectionReducer from 'src/store/slices/housing/sectionSlice'
import notesReducer from 'src/store/slices/housing/notesSlice'
import speciesReducer from 'src/store/slices/housing/speciesSlice'
import mortalityReducer from 'src/store/slices/housing/mortalitySlice'
import animalTreatmentReducer from 'src/store/slices/housing/animalTreatmentSlice'
import mediaReducer from 'src/store/slices/housing/mediaSlice'
import sectionInfiniteScrollReducer from 'src/store/slices/housing/sectionInfiniteScrollSlice'
import speciesInfiniteScrollReducer from 'src/store/slices/housing/speciesInfiniteScrollSlice'
import animalInfiniteScrollReducer from 'src/store/slices/housing/animalInfiniteScrollSlice'
import shipmentReducer from 'src/store/slices/pharmacy/request/shipmentSlice'
import necropsyReducer from 'src/store/slices/necropsy/necropsySlice'
import necropsyFormOptionsReducer from 'src/store/slices/necropsy/necropsyFormOptionsSlice'
import hospitalReducer from 'src/store/slices/hospital/hospitalSlice'

const store = configureStore({
  reducer: {
    insights: insightsReducer,
    siteAnalytics: sitesAnalyticsReducer,
    section: sectionReducer,
    notes: notesReducer,
    species: speciesReducer,
    mortality: mortalityReducer,
    animalTreatment: animalTreatmentReducer,
    media: mediaReducer,
    sectionInfiniteScroll: sectionInfiniteScrollReducer,
    speciesInfiniteScroll: speciesInfiniteScrollReducer,
    animalInfiniteScroll: animalInfiniteScrollReducer,
    shipment: shipmentReducer,
    necropsy: necropsyReducer,
    necropsyFormOptions: necropsyFormOptionsReducer,
    hospital: hospitalReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

// Infer types from store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
