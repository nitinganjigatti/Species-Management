const composeSettingsNavigation = () => {
  const settingsTitle = {
    sectionTitle: 'Settings'
  }

  const requestEnclosureQRCode = {
    title: 'Request Enclosure QR Code',
    path: '/settings/request-enclosure-qr-code',
    icon: 'mdi:qrcode'
  }

  const settingsNavigation = [settingsTitle, requestEnclosureQRCode]

  return settingsNavigation
}

const settingsNavigation = () => composeSettingsNavigation()

export default settingsNavigation
