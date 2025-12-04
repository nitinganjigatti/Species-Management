const PHARMACY_TRANSACTION_CONSTANTS = {
  direct_dispatch: 'Direct Dispatch',
  stock_adjustment: 'Stock Adjustment',
  discard: 'Return to Supplier',
  escrow: 'Escrow',
  request: 'Request',
  purchase: 'Purchase',
  return: 'Return',
  dispense: 'Dispense',
  dispatch_cancel: 'Dispatch Cancel'
}

export const STOCK_ADJUSTMENT_REASON_TYPES = {
  MISSED: '1',
  EXPIRED: '2',
  DAMAGED: '3'
}

export const dateRangeOptions = [
  { label: 'All', value: 'all' },
  { label: 'Last 3 Days', value: '3' },
  { label: '3–7 Days', value: '7' },
  { label: '7–15 Days', value: '15' },
  { label: '15+ Days', value: '16' }
]

export const statusOptions = [
  { id: 'all', value: 'all', label: 'All' },
  { id: 'active', value: 'active', label: 'Active' },
  { id: 'inactive', value: 'inactive', label: 'Inactive' }
]

export const getPharmacyTransactionConstants = key => PHARMACY_TRANSACTION_CONSTANTS[key] || key
