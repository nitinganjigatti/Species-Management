import { getSelectedPharmacy } from 'src/lib/api/pharmacy/selectedPharmacy'

const composePharmacyNavigation = ({ pharmacyList, pharmacyRole, selectedPharmacy }) => {
  const pharmacyTitle = {
    sectionTitle: 'Pharmacy'
  }

  const inventoryParent = {
    title: 'Inventory',
    path: '/pharmacy/medicine/product-list',
    icon: 'mdi:medical-bag',
    children: []
  }

  const productsList = {
    title: 'Product List',
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
    title: 'Purchase list',
    path: '/pharmacy/purchase/purchaseList'
  }

  const requestParent = {
    title: 'Request',
    icon: 'lucide:git-pull-request',
    path: '/pharmacy/request/request-list',
    children: []
  }

  const requestListing = {
    title: 'Request',
    path: '/pharmacy/request/request-list'
  }

  const returnParent = {
    title: 'Return',
    icon: 'lucide:git-pull-request',
    path: '/pharmacy/return-product/request-list',
    children: []
  }

  const returnListing = {
    title: 'Return Request List',
    path: '/pharmacy/return-product/request-list'
  }

  const addReturnRequest = {
    title: 'Add Return Request',
    path: '/pharmacy/return-product/add-request'
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
    title: 'Stock report(Batch wise)',
    path: '/pharmacy/stocks/stockReportByBatch'
  }

  const stockOut = {
    title: 'Stock Out',
    path: '/pharmacy/stocks/stock-out'
  }

  const expiredMedicine = {
    title: 'Expired Medicine',
    path: '/pharmacy/stocks/expired-medicine'
  }

  const settingsParent = {
    title: 'Settings',
    path: '/pharmacy/settings',
    icon: 'mdi:settings',
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
    path: '/pharmacy/settings/storeList'
  }

  const supplierList = {
    title: 'Supplier list',
    path: '/pharmacy/settings/supplier/supplier-list'
  }

  const testList = {
    title: 'Test Module',
    path: '/test/'
  }

  const pharmacyNavigationArray = []
  pharmacyNavigationArray.push(testList)
  pharmacyNavigationArray.push(pharmacyTitle)

  if (selectedPharmacy?.type === 'central') {
    inventoryParent.children.push(productsList)
    PurchaseParent.children.push(purchaseList)
    requestParent.children.push(requestListing)
    returnParent.children.push(returnListing)
    stockParent.children.push(stockReport, stockReportByBatch, stockOut, expiredMedicine)
    settingsParent.children.push(
      gst,
      uom,
      productForm,
      drugClass,
      manufacturer,
      packages,
      salts,
      storage,
      storeList,
      supplierList
    )

    pharmacyNavigationArray.push(
      inventoryParent,
      PurchaseParent,
      requestParent,
      returnParent,
      stockParent,
      settingsParent
    )
  }

  if (selectedPharmacy?.type === 'local') {
    requestParent.children.push(requestListing)
    returnParent.children.push(returnListing, addReturnRequest)
    stockParent.children.push(stockReport, stockReportByBatch, stockOut, expiredMedicine)

    pharmacyNavigationArray.push(requestParent, returnParent, stockParent)
  }

  console.log(pharmacyNavigationArray)

  return pharmacyNavigationArray
}

const pharmacyNavigation = ({ pharmacyList, pharmacyRole, selectedPharmacy }) =>
  composePharmacyNavigation({ pharmacyList, pharmacyRole, selectedPharmacy })

export default pharmacyNavigation
