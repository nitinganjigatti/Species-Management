import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllShipmentsSelectedStore } from 'src/lib/api/pharmacy/storeWiseRequest'

export const fetchShipments = createAsyncThunk(
  'shipment/fetchShipments',
  async ({ storeId }, { getState, rejectWithValue }) => {
    const { page, pageSize, search, sort, sortColumn, priority } = getState().shipment

    try {
      const params = {
        limit: pageSize,
        page: page + 1,
        q: search,
        sort,
        column: sortColumn,
        ...(priority !== 'all' && { priority })
      }

      const res = await getAllShipmentsSelectedStore({ params }, storeId)

      if (res?.success === true && res?.data?.dispatch_items?.length > 0) {
        const list = res?.data?.dispatch_items?.map(item => ({
          ...item,
          id: item?.dispatch_item_id
        }))

        return { list, total: parseInt(res?.data?.total || 0) }
      }

      return { list: [], total: 0 }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch shipments')
    }
  }
)

const shipmentSlice = createSlice({
  name: 'shipment',
  initialState: {
    list: [],
    total: 0,
    loading: false,
    error: null,
    page: 0,
    pageSize: 50,
    search: '',
    sort: 'asc',
    sortColumn: '',
    priority: 'all',
    selectedRows: [],
    dispatchedItems: []
  },
  reducers: {
    setShipmentParams: (state, action) => {
      Object.assign(state, action.payload)
    },
    setSelectedRows: (state, action) => {
      state.selectedRows = action.payload
    },
    setDispatchedItems: (state, action) => {
      state.dispatchedItems = action.payload
    },
    clearShipment: state => {
      state.list = []
      state.total = 0
      state.loading = false
      state.error = null
      state.page = 0
      state.pageSize = 50
      state.search = ''
      state.sort = 'asc'
      state.sortColumn = ''
      state.priority = 'all'
      state.selectedRows = []
      state.dispatchedItems = []
    },
    clearDispatchedItems: state => {
      state.dispatchedItems = []
      state.selectedRows = []
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchShipments.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchShipments.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchShipments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { setShipmentParams, setSelectedRows, setDispatchedItems, clearShipment, clearDispatchedItems } =
  shipmentSlice.actions

export default shipmentSlice.reducer
