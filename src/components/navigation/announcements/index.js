const composeAnnouncementsNavigation = () => {
  const Title = {
    sectionTitle: 'Announcements'
  }

  const announcements = {
    title: 'Announcements',
    path: '/announcements/',
    icon: 'mdi:bullhorn-outline'
  }

  const announcementsNavigationArray = []

  announcementsNavigationArray.push(Title)
  announcementsNavigationArray.push(announcements)

  return announcementsNavigationArray
}

const announcementsNavigation = () => composeAnnouncementsNavigation()

export default announcementsNavigation
