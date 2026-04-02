const composeAnimalsNavigation = () => {
  const Title = {
    sectionTitle: 'Animals'
  }

  const announcements = {
    title: 'Animals',
    path: '/animals/',
    icon: 'cil:animal'
  }

  const animalsNavigationArray = []

  animalsNavigationArray.push(Title)
  animalsNavigationArray.push(announcements)

  return animalsNavigationArray
}

const animalsNavigation = () => composeAnimalsNavigation()

export default animalsNavigation
