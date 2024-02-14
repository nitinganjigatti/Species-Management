import { getSelectedPharmacy } from 'src/lib/api/pharmacy/selectedPharmacy'

const composePharmacyNavigation = ({ pharmacyList, pharmacyRole, selectedPharmacy }) => {
  const pharmacyTitle = {
    sectionTitle: 'Pharmacy'
  }

  const inventoryParent = {
    title: 'Inventory',
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
    title: 'Direct Dispatch',
    path: '/pharmacy/direct-dispatch',
    icon: 'iconamoon:delivery-light',
    children: []
  }

  const directDispatchList = {
    title: 'Dispatch',
    icon: 'iconamoon:delivery-light',
    path: '/pharmacy/direct-dispatch/direct-dispatch-list'
  }

  const stockParent = {
    title: 'Stocks',
    path: '/pharmacy/store',
    icon: 'bi:boxes',
    children: []
  }

  const stockReport = {
    title: 'Stock report',
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
    path: '/pharmacy/settings/gst'
  }

  const uom = {
    title: 'UOM',
    path: '/pharmacy/settings/uom'
  }

  const productForm = {
    title: 'Product Form',
    path: '/pharmacy/settings/product-form'
  }

  const drugClass = {
    title: 'Drug class',
    path: '/pharmacy/settings/drug-class'
  }

  const manufacturer = {
    title: 'Manufacturer',
    path: '/pharmacy/settings/manufacturer'
  }

  const packages = {
    title: 'Packages',
    path: '/pharmacy/settings/packages'
  }

  const salts = {
    title: 'Salts',
    path: '/pharmacy/settings/salts'
  }

  const storage = {
    title: 'Storage',
    path: '/pharmacy/settings/storage'
  }

  const storeList = {
    title: 'Store list',
    path: '/pharmacy/settings/store-list'
  }

  const supplierList = {
    title: 'Supplier list',
    path: '/pharmacy/settings/supplier/supplier-list'
  }

  const genericNamesList = {
    title: 'Generic Names',
    path: '/pharmacy/settings/generic'
  }

  const testList = {
    title: 'Test Module',
    path: '/test/'
  }

  const rackList = {
    title: 'Rack list',
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

  const pharmacyNavigationArray = []

  // pharmacyNavigationArray.push(testList)
  pharmacyNavigationArray.push(pharmacyTitle)

  if (selectedPharmacy?.type === 'central') {
    // inventoryParent.children.push(productsList)
    // PurchaseParent.children.push(purchaseList)
    // requestParent.children.push(requestListing)
    // returnParent.children.push(returnListing)
    // directDispatchParent.children.push(directDispatchList)

    stockParent.children.push(stockReport, stockReportByBatch, stockOut, expiredMedicine)
    settingsParent.children.push(
      gst,
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
      rackList
    )

    pharmacyNavigationArray.push(
      requestListing,
      returnListing,
      directDispatchList,
      purchaseList,
      stockParent,
      productsList,
      settingsParent
    )
  }

  if (selectedPharmacy?.type === 'local') {
    requestParent.children.push(requestListing)
    returnParent.children.push(returnListing)
    stockParent.children.push(stockReport, stockOut, expiredMedicine, escrow)
    directDispatchParent.children.push(directDispatchList)
    settingsParent.children.push(rackList)
    pharmacyNavigationArray.push(
      requestListing,
      returnListing,
      directDispatchList,
      dispense,
      stockParent,
      settingsParent
    )
  }

  // debugger

  if (pharmacyRole && selectedPharmacy === '') {
    settingsParent.children.push(storeList)
    pharmacyNavigationArray.push(settingsParent)
  }

  // console.log(pharmacyNavigationArray)

  return pharmacyNavigationArray
}

const pharmacyNavigation = ({ pharmacyList, pharmacyRole, selectedPharmacy }) =>
  composePharmacyNavigation({ pharmacyList, pharmacyRole, selectedPharmacy })

export default pharmacyNavigation
