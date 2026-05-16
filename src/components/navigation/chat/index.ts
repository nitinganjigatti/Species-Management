import { ROUTES } from 'src/constants/routes'
import type { NavItem, NavSection, NavigationItem } from 'src/types/navigation'

const composeChatNavigation = (): NavigationItem[] => {
  const Title: NavSection = {
    sectionTitle: 'Chat'
  }

  const chat: NavItem = {
    title: 'Chat',
    path: ROUTES.chat.root,
    icon: 'mdi:message-outline'
  }

  const chatNavigationArray: NavigationItem[] = []

  chatNavigationArray.push(Title)
  chatNavigationArray.push(chat)

  return chatNavigationArray
}

const chatNavigation = (): NavigationItem[] => composeChatNavigation()

export default chatNavigation
