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
  MISSED: "1",
  EXPIRED: "2",
  DAMAGED: "3"
}

export const getPharmacyTransactionConstants = key => PHARMACY_TRANSACTION_CONSTANTS[key] || key
