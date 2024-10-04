import { getSelectedPharmacy } from 'src/lib/api/pharmacy/selectedPharmacy'

const composePharmacyNavigation = ({ pharmacyList, pharmacyRole, selectedPharmacy }) => {
  const pharmacyTitle = {
    sectionTitle: 'Pharmacy'
  }

  const dashboard = {
    title: 'Dashboard',
    path: '/pharmacy/dashboard',
    icon: 'lets-icons:home-duotone'
  }

  const inventoryParent = {
    title: 'Purchase Invoice',
    path: '/pharmacy/medicine/product-list',
    icon: 'material-symbols:inventory-2-outline',
    children: []
  }

  const productsList = {
    title: 'Products',
    icon: 'material-symbols:inventory-2-outline',
    path: '/pharmacy/medicine/product-list'
  }

  const addProduct = {
    title: 'Add Product',
    path: '/pharmacy/medicine/add-product'
  }

  const PurchaseParent = {
    title: 'Purchase',
    path: '/pharmacy/purchase',
    icon: 'raphael:cart',
    children: []
  }

  const purchaseList = {
    title: 'Inventory',
    icon: 'raphael:cart',
    path: '/pharmacy/purchase/purchase-list'
  }

  const existingPurchase = {
    title: 'Add Existing Inventory',
    icon: 'raphael:cart',
    path: '/pharmacy/purchase/add-purchase/existing-purchases'
  }

  const stocksAdjustment = {
    title: 'Stocks Adjustment',
    icon: 'material-symbols:rule-settings',
    path: '/pharmacy/stocks-adjustments/stock-adjustment-list'
  }

  const report = {
    title: 'Report',
    path: '/pharmacy/purchase/report'
  }

  const requestParent = {
    title: 'Request',
    icon: 'material-symbols:request-quote-outline',

    path: '/pharmacy/request/request-list',

    children: []
  }

  const requestListing = {
    title: 'Request',
    icon: 'material-symbols:request-quote-outline',
    path: '/pharmacy/request/request-list'
  }

  const returnParent = {
    title: 'Return',
    icon: 'material-symbols:assignment-returned-outline-sharp',

    path: '/pharmacy/return-product/request-list',

    children: []
  }

  const returnListing = {
    title: 'Returns',
    icon: 'material-symbols:assignment-returned-outline-sharp',
    path: '/pharmacy/return-product/request-list'
  }

  const addReturnRequest = {
    title: 'Add Return Request',
    path: '/pharmacy/return-product/add-request'
  }

  const directDispatchParent = {
    // title: 'Direct Dispatch',
    title: 'Dispatch without request',

    path: '/pharmacy/direct-dispatch',

    icon: 'iconamoon:delivery-light',
    children: []
  }

  const directDispatchList = {
    title: `Dispatch without request`,
    icon: 'iconamoon:delivery-light',

    path: '/pharmacy/direct-dispatch/direct-dispatch-list'
  }

  const directDispatchListForLocal = {
    title: 'Received',
    icon: 'iconamoon:delivery-light',
    path: '/pharmacy/direct-dispatch/direct-dispatch-list'
  }

  const localDispatchParent = {
    title: 'Local Dispatch',
    path: '/pharmacy/local-dispatch',
    icon: 'iconamoon:delivery-light',
    children: []
  }

  const localDispatchList = {
    title: 'Direct Dispatch Local',
    icon: 'iconamoon:delivery-light',
    path: '/pharmacy/local-dispatch/local-dispatch-list'
  }

  const stockParent = {
    title: 'Stocks',
    path: '/pharmacy/store',
    icon: 'bi:boxes',
    children: []
  }

  const stockReport = {
    icon: 'bi:boxes',
    title: 'Stock Report',
    path: '/pharmacy/stocks/stocksReport'
  }

  const stockReportByBatch = {
    title: 'Stock report by Store ',
    path: '/pharmacy/stocks/stockReportByBatch'
  }

  const stockOut = {
    title: 'Out of Stock',
    path: '/pharmacy/stocks/out-of-stock'
  }

  const expiredMedicine = {
    title: 'Expired Medicine',
    path: '/pharmacy/stocks/expired-medicine'
  }

  const escrow = {
    title: 'Escrow',
    path: '/pharmacy/stocks/escrow'
  }

  const settingsParent = {
    title: 'Settings',
    path: '/pharmacy/settings',
    icon: 'uil:setting',
    children: []
  }

  const gst = {
    title: 'GST',
    path: '/pharmacy/masters/gst'
  }

  const uom = {
    title: 'UOM',
    path: '/pharmacy/masters/uom'
  }

  const productForm = {
    title: 'Product Form',
    path: '/pharmacy/masters/product-form'
  }

  const drugClass = {
    title: 'Drug Class',
    path: '/pharmacy/masters/drug-class'
  }

  const manufacturer = {
    title: 'Manufacturer',
    path: '/pharmacy/masters/manufacturer'
  }

  const packages = {
    title: 'Packages',
    path: '/pharmacy/masters/packages'
  }

  const salts = {
    title: 'Salts',
    path: '/pharmacy/masters/salts'
  }

  const storage = {
    title: 'Storage',
    path: '/pharmacy/masters/storage'
  }

  const state = {
    title: 'State List',
    path: '/pharmacy/masters/state'
  }

  const driver = {
    title: 'Driver List',
    path: '/pharmacy/masters/driver'
  }

  const storeList = {
    title: 'Pharmacy List',
    path: '/pharmacy/masters/store-list'
  }

  const supplierList = {
    title: 'Supplier List',
    path: '/pharmacy/masters/supplier/supplier-list'
  }

  const genericNamesList = {
    title: 'Generic Names',
    path: '/pharmacy/masters/generic'
  }

  const testList = {
    title: 'Test Module',
    path: '/test/'
  }

  const rackList = {
    title: 'Rack List',
    path: '/pharmacy/store/rackList'
  }

  const dispense = {
    title: 'Dispense',
    path: '/pharmacy/dispense',
    icon: 'bi:boxes'
  }

  const addDispense = {
    title: 'Dispense List',
    path: '/pharmacy/dispense/add-dispense'
  }

  const nonExistingProductRequestList = {
    title: 'New Product Request',
    icon: 'tabler:report-medical',
    path: '/pharmacy/new-product-request'
  }

  const mastersParent = {
    title: 'Master',
    path: '/pharmacy/masters/',
    icon: 'uil:setting',
    children: []
  }

  const discard = {
    icon: 'tabler:truck-return',
    title: 'Return To Supplier',
    path: '/pharmacy/discard/discard-list'
  }

  const pharmacyNavigationArray = []

  // pharmacyNavigationArray.push(testList)
  pharmacyNavigationArray.push(pharmacyTitle)

  if (selectedPharmacy?.type === 'central') {
    // inventoryParent.children.push(productsList)
    // PurchaseParent.children.push(purchaseList)
    // requestParent.children.push(requestListing)
    // returnParent.children.push(returnListing)
    // directDispatchParent.children.push(directDispatchList)
    // stockParent.children.push(stockReport)
    settingsParent.children.push(
      rackList

      // uom,
      // productForm,
      // genericNamesList,
      // drugClass,
      // manufacturer,
      // packages,
      // storeList,
      // salts,
      // storage,
      // supplierList,

      // state
    )

    pharmacyNavigationArray.push(dashboard, stockReport, requestListing, returnListing, directDispatchList)

    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy?.permission?.dispense_medicine
    ) {
      pharmacyNavigationArray.push(dispense)
    }

    pharmacyNavigationArray.push(productsList, purchaseList, existingPurchase, nonExistingProductRequestList)

    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.stock_adjustment === 1
    ) {
      pharmacyNavigationArray.push(stocksAdjustment)
    }

    pharmacyNavigationArray.push(discard, settingsParent)
  }

  if (selectedPharmacy?.type === 'local') {
    requestParent.children.push(requestListing)
    returnParent.children.push(returnListing)

    // stockParent.children.push(stockReport, escrow)
    directDispatchParent.children.push(directDispatchList)
    settingsParent.children.push(rackList)
    pharmacyNavigationArray.push(
      dashboard,
      requestListing,
      returnListing,

      // directDispatchList,
      directDispatchListForLocal
    )
    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy?.permission?.dispense_medicine
    ) {
      pharmacyNavigationArray.splice(4, 0, dispense)
    }

    pharmacyNavigationArray.push(
      localDispatchList,

      nonExistingProductRequestList,
      stockReport
    )
    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.stock_adjustment === 1
    ) {
      pharmacyNavigationArray.push(stocksAdjustment)
    }
    pharmacyNavigationArray.push(settingsParent)
  }

  if (pharmacyRole) {
    mastersParent.children.push(
      uom,
      productForm,
      genericNamesList,
      drugClass,
      manufacturer,
      packages,
      storeList,
      salts,
      storage,
      supplierList,
      state,
      driver
    )
    pharmacyNavigationArray.push(mastersParent)
  }

  return pharmacyNavigationArray
}

const pharmacyNavigation = ({ pharmacyList, pharmacyRole, selectedPharmacy }) =>
  composePharmacyNavigation({ pharmacyList, pharmacyRole, selectedPharmacy })

export default pharmacyNavigation
