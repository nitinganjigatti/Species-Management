import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  data: {}
}

const hospitalSlice = createSlice({
  name: 'hospital',
  initialState,
  reducers: {
    updateState: (state, action) => {
      const { key, value } = action.payload
      state.data[key] = value
    },
    updateMultipleStates: (state, action) => {
      state.data = {
        ...state.data,
        ...action.payload
      }
    },
    resetState: (state, action) => {
      const key = action.payload
      delete state.data[key]
    },
    resetAllStates: state => {
      state.data = {}
    }
  }
})

export const { updateState, updateMultipleStates, resetState, resetAllStates } = hospitalSlice.actions

export default hospitalSlice.reducer
