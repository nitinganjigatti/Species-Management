const composeSettingsNavigation = ({ userRole } = {}) => {
  const settingsTitle = {
    sectionTitle: 'Settings'
  }

  const requestEnclosureQRCode = {
    title: 'Enclosure QR Codes',
    path: '/settings/request-enclosure-qr-code',
    icon: 'mdi:qrcode'
  }

  const settingsNavigation = [settingsTitle, requestEnclosureQRCode]

  if (userRole === 'Super Admin') {
    settingsNavigation.push({
      title: 'Zoo Settings',
      path: '/zoo-configuration/settings',
      icon: 'mdi:cog'
    })
  }

  return settingsNavigation
}

const settingsNavigation = ({ userRole } = {}) => composeSettingsNavigation({ userRole })

export default settingsNavigation
