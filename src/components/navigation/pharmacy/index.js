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

  // const dashboard = {
  //   title: 'Dashboard',
  //   path: '/pharmacy/dashboard',
  //   icon: 'lets-icons:home-duotone'
  // }

  // const dashboard = {
  //   title: 'Dashboard',
  //   path: '/pharmacy/dashboard',
  //   icon: 'lets-icons:home-duotone'
  // }

  const inventoryParent = {
    title: 'Purchase Invoice',
    path: '/pharmacy/medicine/product-list',
    icon: 'material-symbols:inventory-2-outline',
    children: []
  }

  const productsList = {
    title: 'Products',
    icon: 'material-symbols:inventory-2-outline',
    path: '/pharmacy/medicine',
    activeWhen: ['/pharmacy/medicine', '/pharmacy/medicine/add-product']
  }

  const addProduct = {
    title: 'Add Product',
    path: '/pharmacy/medicine/add-product'
  }

  const PurchaseParent = {
    title: 'Purchase',
    path: '/pharmacy/purchase',
    icon: 'raphael:cart',
    activeWhen: ['/pharmacy/purchase', '/pharmacy/purchase/add-purchase'],

    children: []
  }

  const purchaseList = {
    title: 'Inventory',
    icon: 'raphael:cart',
    path: '/pharmacy/purchase',
    activeWhen: ['/pharmacy/purchase', '/pharmacy/purchase/add-purchase']
  }

  const existingPurchase = {
    title: 'Add Existing Inventory',
    icon: 'raphael:cart',
    activeWhen: ['/pharmacy/purchase/add-purchase/existing-purchases'],
    path: '/pharmacy/purchase/add-purchase/existing-purchases'
  }

  const stocksAdjustment = {
    title: 'Stocks Adjustment',
    icon: 'material-symbols:rule-settings',
    activeWhen: ['/pharmacy/stocks-adjustments', '/pharmacy/stocks-adjustments/add-stock-adjustment'],
    path: '/pharmacy/stocks-adjustments'
  }

  const report = {
    title: 'Report',
    path: '/pharmacy/purchase/report'
  }

  const requestParent = {
    title: 'Request',
    icon: 'material-symbols:request-quote-outline',
    path: '/pharmacy/request',
    children: []
  }

  const requestByStoresParent = {
    title: 'Request',
    icon: 'material-symbols:request-quote-outline',
    path: '/pharmacy/requests-by-store/all-stores-request-list',
    children: []
  }

  const requestListing = {
    title: 'All Requests',

    // icon: 'material-symbols:request-quote-outline',
    path: '/pharmacy/request',
    activeWhen: ['/pharmacy/request/', '/pharmacy/request/add-request']
  }

  const requestByStoreListing = {
    title: 'Requests By Store',

    // icon: 'material-symbols:request-quote-outline',
    path: '/pharmacy/requests-by-store/',
    activeWhen: ['/pharmacy/requests-by-store/']
  }

  const requestByProductListing = {
    title: 'Request By Products',

    // icon: 'material-symbols:request-quote-outline',
    path: '/pharmacy/requests-by-product'
  }

  const returnParent = {
    title: 'Return',
    icon: 'material-symbols:assignment-returned-outline-sharp',

    path: '/pharmacy/return-product',

    children: []
  }

  const returnListing = {
    title: 'Returns',
    icon: 'material-symbols:assignment-returned-outline-sharp',
    activeWhen: ['/pharmacy/return-product', '/pharmacy/return-product/add-request'],

    path: '/pharmacy/return-product'
  }

  const addReturnRequest = {
    title: 'Add Return Request',
    path: '/pharmacy/return-product/add-request'
  }

  const directDispatchParent = {
    // title: 'Direct Dispatch',
    title: 'Dispatch without request',
    path: '/pharmacy/direct-dispatch',
    activeWhen: ['/pharmacy/direct-dispatch', '/pharmacy/direct-dispatch/add-direct-dispatch'],
    icon: 'iconamoon:delivery-light',
    children: []
  }

  const directDispatchList = {
    title: `Dispatch without request`,
    icon: 'iconamoon:delivery-light',
    activeWhen: ['/pharmacy/direct-dispatch', '/pharmacy/direct-dispatch/add-direct-dispatch'],
    path: '/pharmacy/direct-dispatch'
  }

  const directDispatchListForLocal = {
    title: 'Received',
    icon: 'iconamoon:delivery-light',
    activeWhen: ['/pharmacy/direct-dispatch', '/pharmacy/direct-dispatch/add-direct-dispatch'],
    path: '/pharmacy/direct-dispatch'
  }

  const localDispatchParent = {
    title: 'Local Dispatch',
    path: '/pharmacy/local-dispatch',
    activeWhen: ['/pharmacy/local-dispatch', '/pharmacy/local-dispatch/add-local-dispatch'],

    icon: 'iconamoon:delivery-light',
    children: []
  }

  const localDispatchList = {
    title: 'Direct Dispatch Local',
    icon: 'iconamoon:delivery-light',
    activeWhen: ['/pharmacy/local-dispatch', '/pharmacy/local-dispatch/add-local-dispatch'],

    path: '/pharmacy/local-dispatch'
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

  const variant = {
    title: 'Variants',
    path: '/pharmacy/masters/variant'
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

  const pharmacySettings = {
    title: 'Pharmacy Settings',
    path: '/pharmacy/store/pharmacy-settings'
  }

  const dispense = {
    title: 'Dispense',
    path: '/pharmacy/dispense',
    activeWhen: ['/pharmacy/dispense', '/pharmacy/dispense/add-dispense'],

    icon: 'bi:boxes'
  }

  const addDispense = {
    title: 'Dispense List',
    path: '/pharmacy/dispense/add-dispense'
  }

  const nonExistingProductRequestList = {
    title: 'New Product Requests',

    // icon: 'tabler:report-medical',
    path: '/pharmacy/new-product-request',
    activeWhen: ['/pharmacy/new-product-request', '/pharmacy/new-product-request/request-product']
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
    path: '/pharmacy/discard',
    activeWhen: ['/pharmacy/discard', '/pharmacy/discard/add-discard']
  }

  const reportsParent = {
    icon: 'tabler:report-analytics',
    title: 'Reports',
    path: '/pharmacy/reports',
    key: 'pharmacy-reports',
    children: []
  }

  const consumptionReport = {
    title: 'Consumption Report',
    path: '/pharmacy/reports/consumption-report'
  }

  const returnReport = {
    title: 'Return Report',
    path: '/pharmacy/reports/return-report'
  }

  const shipmentReport = {
    title: `${selectedPharmacy?.type === 'central' ? 'Shipment Report' : 'Dispatch Report'}`,
    path: '/pharmacy/reports/shipment-report'
  }

  const purchaseReport = {
    title: 'Purchase Report',
    path: '/pharmacy/reports/purchase-report'
  }

  const requestReport = {
    title: 'Pending Request Report',
    path: '/pharmacy/reports/request-report'
  }

  const dispenseReport = {
    title: 'Dispense Report',
    path: '/pharmacy/reports/dispense-report'
  }

  const returnToSupplierReport = {
    title: 'Return To Supplier Report',
    path: '/pharmacy/reports/return-to-supplier'
  }

  const allRequestedItemsReport = {
    title: 'All requested Item Report',
    path: '/pharmacy/reports/all-requested-items'
  }

  const reconciliationReport = {
    title: 'Reconciliation Report',
    path: '/pharmacy/reports/reconciliation-report'
  }

  const rackAndShelves = {
    icon: 'tabler:settings-spark',
    title: 'Racks And Shelves',
    path: '/pharmacy/stock-location'
  }

  const shipmentParent = {
    title: 'Shipments',
    path: '/pharmacy/shipments',
    icon: 'la:shipping-fast',
    activeWhen: [
      '/pharmacy/shipments/',
      '/pharmacy/shipments/incoming-shipments',
      '/pharmacy/shipments/outgoing-shipments'
    ],
    children: [
      {
        title: 'Incoming Shipments',
        path: '/pharmacy/shipments/incoming-shipments'
      },
      {
        title: 'Outgoing Shipments',
        path: '/pharmacy/shipments/outgoing-shipments'
      }
    ]
  }

  // const incomingShipments = {
  //   title: 'Incoming Shipments',
  //   path:  '/pharmacy/shipments/incoming-shipments'
  // }
  // const incomingShipments = {
  //   title: 'Outgoing Shipments',
  //   path:   '/pharmacy/shipments/outgoing-shipments'
  // }

  reportsParent.children.push(consumptionReport)
  reportsParent.children.push(returnReport)
  reportsParent.children.push(shipmentReport)
  reportsParent.children.push(dispenseReport)
  reportsParent.children.push(reconciliationReport)

  const pharmacyNavigationArray = []

  // pharmacyNavigationArray.push(testList)
  pharmacyNavigationArray.push(pharmacyTitle)

  if (selectedPharmacy?.type === 'central') {
    // inventoryParent.children.push(productsList)
    // PurchaseParent.children.push(purchaseList)
    requestParent.children.push(requestListing)
    requestParent.children.push(requestByStoreListing)
    requestParent.children.push(nonExistingProductRequestList)

    reportsParent.children.push(purchaseReport)
    reportsParent.children.push(requestReport)
    reportsParent.children.push(returnToSupplierReport)
    reportsParent.children.push(allRequestedItemsReport)

    // requestParent.children.push(requestByProductListing)

    // returnParent.children.push(returnListing)
    // directDispatchParent.children.push(directDispatchList)
    // stockParent.children.push(stockReport)
    settingsParent.children.push(
      rackList,
      pharmacySettings

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

    pharmacyNavigationArray.push(
      dashboard,

      //dashboardnew,
      stockReport,

      // requestListing,
      // requestByStoreListing,
      requestParent,
      returnListing,

      // reportsParent,
      directDispatchList,
      shipmentParent
    )

    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy?.permission?.dispense_medicine
    ) {
      pharmacyNavigationArray.push(dispense)
    }

    pharmacyNavigationArray.push(
      productsList,
      purchaseList

      //  nonExistingProductRequestList
    )

    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy?.permission?.pharmacy_module === 'ADD'
    ) {
      pharmacyNavigationArray.push(existingPurchase)
    }

    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.stock_adjustment === 1
    ) {
      pharmacyNavigationArray.push(stocksAdjustment)
    }

    pharmacyNavigationArray.push(reportsParent, discard, rackAndShelves, settingsParent)
  }

  if (selectedPharmacy?.type === 'local') {
    requestParent.children.push(requestListing)
    requestParent.children.push(requestByProductListing)

    // requestParent.children.push(requestByStoreListing)
    requestParent.children.push(nonExistingProductRequestList)

    // debugger
    // requestParent.children.push({
    //   title: 'Requests By Store',

    //   // icon: 'material-symbols:request-quote-outline',
    //   path: `/pharmacy/requests-by-store/${selectedPharmacy.id}`
    // })

    // requestByStoresParent.children.push(requestByStoreListing)
    returnParent.children.push(returnListing)

    // stockParent.children.push(stockReport, escrow)
    directDispatchParent.children.push(directDispatchList)
    settingsParent.children.push(rackList)
    pharmacyNavigationArray.push(
      dashboard,

      //dashboardnew,
      // requestListing,
      requestParent,

      // requestByStoreListing,
      returnListing,

      // directDispatchList,
      directDispatchListForLocal,
      shipmentParent
    )
    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy?.permission?.dispense_medicine
    ) {
      pharmacyNavigationArray.splice(4, 0, dispense)
    }

    pharmacyNavigationArray.push(
      localDispatchList,

      // nonExistingProductRequestList,
      stockReport
    )
    if (
      selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.stock_adjustment === 1
    ) {
      pharmacyNavigationArray.push(stocksAdjustment)
    }
    pharmacyNavigationArray.push(reportsParent, rackAndShelves, settingsParent)
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
    if (selectedPharmacy?.type === 'central') {
      mastersParent.children.push(variant)
    }
    pharmacyNavigationArray.push(mastersParent)
  }

  return pharmacyNavigationArray
}

const pharmacyNavigation = ({ pharmacyList, pharmacyRole, selectedPharmacy }) =>
  composePharmacyNavigation({ pharmacyList, pharmacyRole, selectedPharmacy })

export default pharmacyNavigation
