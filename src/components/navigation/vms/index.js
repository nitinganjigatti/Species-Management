const composeVmsNavigation = ({ vmsPassView, vmsScan, vmsReports, vmsGadgetsManage }) => {
  const Title = { sectionTitle: 'Visitor Management' }

  const dashboard = {
    title: 'Dashboard',
    path: '/vms/dashboard/',
    icon: 'mdi:chart-box-outline',
  }

  const passes = {
    title: 'Passes',
    path: '/vms/passes/',
    icon: 'mdi:badge-account-outline',
  }

  const scan = {
    title: 'Verify / Scan',
    path: '/vms/scan/',
    icon: 'mdi:qrcode-scan',
  }

  const reports = {
    title: 'Reports',
    path: '/vms/reports/',
    icon: 'mdi:file-chart-outline',
  }

  const gadgets = {
    title: 'Gadgets',
    path: '/vms/gadgets/',
    icon: 'mdi:devices',
  }

  const navigationArray = []
  navigationArray.push(Title)

  if (vmsReports) navigationArray.push(dashboard)
  if (vmsPassView) navigationArray.push(passes)
  if (vmsScan) navigationArray.push(scan)
  if (vmsReports) navigationArray.push(reports)
  if (vmsGadgetsManage) navigationArray.push(gadgets)

  return navigationArray
}

const vmsNavigation = (params) => composeVmsNavigation(params)

export default vmsNavigation
