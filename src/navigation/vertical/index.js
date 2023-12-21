<<<<<<< HEAD
=======
import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import { usePharmacyContext } from 'src/context/PharmacyContext'
>>>>>>> e6d9ab6 (Changes related to Pharmacy permissions.)
import pharmacyNavigation from 'src/components/navigation/pharmacy'

const pharmacyNav = [
  // {
  //   title: 'Home',
  //   path: '/home',
  //   icon: 'mdi:home-outline'
  // },
  {
    sectionTitle: 'Pharmacy'
  },

//   {
//     title: 'Inventory',
//     path: '/pharmacy/medicine/product-list',
//     icon: 'mdi:medical-bag',
//     children: [
//       {
//         title: 'Product List',
//         path: '/pharmacy/medicine/product-list'
//       },
//       {
//         title: 'Add Product',
//         path: '/pharmacy/medicine/add-product'
//       }
//     ]
//   },

//   {
//     title: 'Purchase',
//     path: '/pharmacy/purchase',
//     icon: 'raphael:cart',
//     children: [
//       {
//         title: 'Purchase list',
//         path: '/pharmacy/purchase/purchaseList'
//       }

//       // {
//       //   title: 'Payment list',
//       //   path: '/pharmacy/purchase/paymentList'
//       // }
//     ]
//   },
//   {
//     title: 'Request',
//     icon: 'lucide:git-pull-request',
//     path: '/pharmacy/request/request-list',

//     children: [
//       {
//         title: 'Request',
//         path: '/pharmacy/request/request-list'
//       }
//     ]
//   },
//   {
//     title: 'Return',
//     icon: 'lucide:git-pull-request',
//     path: '/pharmacy/return-product/request-list',

//     children: [
//       {
//         title: 'Return Request List',
//         path: '/pharmacy/return-product/request-list'
//       },
//       {
//         title: 'Add Return Request',
//         path: '/pharmacy/return-product/add-request'
//       }
//     ]
//   },

//   {
//     title: 'Stocks',
//     path: '/pharmacy/store',
//     icon: 'bi:boxes',
//     children: [
//       {
//         title: 'Stock report',
//         path: '/pharmacy/stocks/stocksReport'
//       },
//       {
//         title: 'Stock report(Batch wise)',
//         path: '/pharmacy/stocks/stockReportByBatch'
//       },
//       {
//         title: 'Stock Out',
//         path: '/pharmacy/stocks/stock-out'
//       },
//       {
//         title: 'Expired Medicine',
//         path: '/pharmacy/stocks/expired-medicine'
//       }
//     ]
//   },

//   // {
//   //   title: 'Supplier',
//   //   path: '/pharmacy/supplier',
//   //   icon: 'material-symbols:bath-public-large-rounded',
//   //   children: [
//   //     {
//   //       title: 'Supplier',
//   //       path: '/pharmacy/supplier'
//   //     },
//   //     {
//   //       title: 'Supplier Ledger',
//   //       path: '/pharmacy/supplier/supplier-ledger'
//   //     }
//   //   ]
//   // },

//   // {
//   //   sectionTitle: 'Medicine'
//   // },

//   {
//     title: 'Settings',
//     path: '/pharmacy/settings',
//     icon: 'mdi:settings',
//     children: [
//       {
//         title: 'GST',
//         path: '/pharmacy/settings/gst'
//       },

//       // {
//       //   title: 'State',
//       //   path: '/pharmacy/medicine/state'
//       // },
//       // {
//       //   title: 'Generic',
//       //   path: '/pharmacy/medicine/generic'
//       // },
//       // {
//       //   title: 'Category',
//       //   path: '/pharmacy/medicine/category'
//       // },

//       {
//         title: 'UOM',
//         path: '/pharmacy/settings/uom'
//       },
//       {
//         title: 'Product Form',
//         path: '/pharmacy/settings/product-form'
//       },
//       {
//         title: 'Drug class',
//         path: '/pharmacy/settings/drug-class'
//       },
//       {
//         title: 'Manufacturer',
//         path: '/pharmacy/settings/manufacturer'
//       },
//       {
//         title: 'Packages',
//         path: '/pharmacy/settings/packages'
//       },
//       {
//         title: 'Salts',
//         path: '/pharmacy/settings/salts'
//       },
//       {
//         title: 'Storage',
//         path: '/pharmacy/settings/storage'
//       },
//       {
//         title: 'Store list',
//         path: '/pharmacy/settings/storeList'
//       },
//       {
//         title: 'Supplier list',
//         path: '/pharmacy/settings/supplier/supplier-list'
//       }
//     ]
//   }

//   // {
//   //   title: 'Purchase',
//   //   path: '/pharmacy/purchase',
//   //   icon: 'raphael:cart',
//   //   children: [
//   //     {
//   //       title: 'Purchase list',
//   //       path: '/pharmacy/purchase/purchaseList'
//   //     },

//   //     {
//   //       title: 'Payment list',
//   //       path: '/pharmacy/purchase/paymentList'
//   //     }
//   //   ]
//   // },
//   // {
//   //   title: 'Store',
//   //   path: '/pharmacy/store',
//   //   icon: 'bx:store',
//   //   children: [
//   //     {
//   //       title: 'Store list',
//   //       path: '/pharmacy/store/storeList'
//   //     },
//   //     {
//   //       title: 'Rack list',
//   //       path: '/pharmacy/store/rackList'
//   //     }
//   //   ]
//   // }
//   // {
//   //   title: 'Shipment',
//   //   path: '/pharmacy/shipment',
//   //   icon: 'streamline:shipping-box-1-box-package-label-delivery-shipment-shipping',
//   //   children: [
//   //     {
//   //       title: 'Shipment',
//   //       path: '/pharmacy/shipment/shipment'
//   //     }
//   //   ]
//   // },
//   // {
//   //   title: 'Allocation',
//   //   path: '/pharmacy/allocation',

//   //   icon: 'pajamas:assignee',
//   //   children: [
//   //     {
//   //       title: 'Allocation',
//   //       path: '/pharmacy/allocation/allocation'
//   //     }
//   //   ]
//   // },
//   // {
//   //   title: 'Debit Note',
//   //   icon: 'icon-park:play-cycle',
//   //   path: '/pharmacy/debitNote',

//   //   children: [
//   //     {
//   //       title: 'Debit Note',
//   //       path: '/pharmacy/debitNote/debitNote'
//   //     }
//   //   ]
//   // }

//   // {
//   //   title: 'Dispatch',
//   //   icon: 'bxs:log-out',
//   //   children: [
//   //     {
//   //       title: 'Dispatch',
//   //       path: '/pharmacy/dispatch/dispatch'
//   //     },
//   //     {
//   //       title: 'Dispatch validation',
//   //       path: '/pharmacy/dispatch/dispatchValidation'
//   //     }
//   //   ]
//   // },

//   // {
//   //   sectionTitle: 'Others'
//   // },
//   // {
//   //   title: 'Second Page',
//   //   path: '/second-page',
//   //   icon: 'mdi:email-outline'
//   // },
//   // {
//   //   path: '/acl',
//   //   action: 'read',
//   //   subject: 'acl-page',
//   //   title: 'Access Control',
//   //   icon: 'mdi:shield-outline'
//   // }
// ]

<<<<<<< HEAD
const composeNavigation = () => {
  const navigationArray = []

  if (pharmacy) {
    navigationArray.push(...pharmacyNavigation())
=======
const ComposeNavigation = () => {
  const authData = useContext(AuthContext)
  const pharmacyList = authData?.userData?.modules?.pharmacy_data?.pharmacy
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy
  debugger
  const { selectedValue } = usePharmacyContext()

  const navigationArray = []

  if (pharmacyList?.length > 0 || pharmacyRole) {
    const pharmacyNav = pharmacyNavigation({ pharmacyList, pharmacyRole, selectedPharmacy: selectedValue })
    navigationArray.push(...pharmacyNav)
>>>>>>> e6d9ab6 (Changes related to Pharmacy permissions.)
  }

  // if (lab) {
  navigationArray.push(...labNavigation())

  // }

  return navigationArray
}

const navigation = () => ComposeNavigation()

export default navigation
