const PHARMACY_TRANSACTION_CONSTANTS = {
  direct_dispatch: 'Direct Dispatch',
  stock_adjustment: 'Stock Adjustment',
  discard: 'Return to Supplier',
  escrow: 'Escrow',
  request: 'Request',
  purchase: 'Purchase',
  return: 'Return',
  dispense: 'Dispense'
}

export const getPharmacyTransactionConstants = key => PHARMACY_TRANSACTION_CONSTANTS[key] || key
