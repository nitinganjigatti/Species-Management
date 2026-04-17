import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { HospitalSliceState, UpdateStatePayload } from 'src/types/hospital'

const initialState: HospitalSliceState = {
  data: {}
}

const hospitalSlice = createSlice({
  name: 'hospital',
  initialState,
  reducers: {
    updateState: (state, action: PayloadAction<UpdateStatePayload>) => {
      const { key, value } = action.payload
      state.data[key] = value
    },
    updateMultipleStates: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.data = {
        ...state.data,
        ...action.payload
      }
    },
    resetState: (state, action: PayloadAction<string>) => {
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
