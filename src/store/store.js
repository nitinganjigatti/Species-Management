import { configureStore } from '@reduxjs/toolkit'
import insightsReducer from 'src/store/slices/housing/insightsSlice'
import sitesReducer from 'src/store/slices/housing/sitesSlice' 

const store = configureStore({
  reducer: {
    insights: insightsReducer,
    sites: sitesReducer 
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export default store
